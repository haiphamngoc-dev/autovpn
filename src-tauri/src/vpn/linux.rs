use std::process::Command;

use super::types::VpnConnectionStatus;

const NMCLI: &str = "nmcli";

pub fn get_system_vpn_status() -> Result<VpnConnectionStatus, String> {
    match status_from_nmcli()? {
        VpnConnectionStatus::Disconnected if has_active_vpn_interface() => {
            Ok(VpnConnectionStatus::Connected)
        }
        other => Ok(other),
    }
}

pub fn connect_system_vpn() -> Result<(), String> {
    let name = preferred_vpn_profile()?;
    run_nmcli_void(&["connection", "up", "id", &name])
}

pub fn disconnect_system_vpn() -> Result<(), String> {
    let active = active_vpn_connection_names()?;

    if active.is_empty() {
        return Ok(());
    }

    for name in active {
        run_nmcli_void(&["connection", "down", "id", &name])?;
    }

    Ok(())
}

fn status_from_nmcli() -> Result<VpnConnectionStatus, String> {
    let output = run_nmcli(&["-t", "-f", "TYPE,STATE", "connection", "show", "--active"])?;

    let mut status = VpnConnectionStatus::Disconnected;

    for line in output
        .lines()
        .map(str::trim)
        .filter(|line| !line.is_empty())
    {
        let Some((conn_type, state)) = parse_pair_line(line) else {
            continue;
        };

        if conn_type != "vpn" {
            continue;
        }

        match VpnConnectionStatus::from_nm_state(state) {
            Some(VpnConnectionStatus::Connected) => return Ok(VpnConnectionStatus::Connected),
            Some(VpnConnectionStatus::Connecting) => status = VpnConnectionStatus::Connecting,
            Some(VpnConnectionStatus::Disconnected) => {}
            None => {}
        }
    }

    if status == VpnConnectionStatus::Disconnected {
        status = status_from_all_connections()?;
    }

    Ok(status)
}

fn status_from_all_connections() -> Result<VpnConnectionStatus, String> {
    let output = run_nmcli(&["-t", "-f", "TYPE,STATE", "connection", "show"])?;
    let mut status = VpnConnectionStatus::Disconnected;

    for line in output
        .lines()
        .map(str::trim)
        .filter(|line| !line.is_empty())
    {
        let Some((conn_type, state)) = parse_pair_line(line) else {
            continue;
        };

        if conn_type != "vpn" {
            continue;
        }

        if let Some(VpnConnectionStatus::Connecting) = VpnConnectionStatus::from_nm_state(state) {
            status = VpnConnectionStatus::Connecting;
        }
    }

    Ok(status)
}

fn parse_pair_line(line: &str) -> Option<(&str, &str)> {
    let (conn_type, state) = line.split_once(':')?;

    Some((conn_type, state))
}

fn active_vpn_connection_names() -> Result<Vec<String>, String> {
    let output = run_nmcli(&["-t", "-f", "NAME,TYPE", "connection", "show", "--active"])?;

    Ok(output
        .lines()
        .map(str::trim)
        .filter(|line| !line.is_empty())
        .filter_map(|line| {
            let mut parts = line.split(':');
            let name = parts.next()?;
            let conn_type = parts.next()?;
            (conn_type == "vpn").then_some(name.to_string())
        })
        .collect())
}

fn preferred_vpn_profile() -> Result<String, String> {
    let output = run_nmcli(&["-t", "-f", "NAME,TYPE", "connection", "show"])?;

    let profiles: Vec<String> = output
        .lines()
        .map(str::trim)
        .filter(|line| !line.is_empty())
        .filter_map(|line| {
            let mut parts = line.split(':');
            let name = parts.next()?;
            let conn_type = parts.next()?;
            (conn_type == "vpn").then_some(name.to_string())
        })
        .collect();

    profiles
        .into_iter()
        .next()
        .ok_or("vpn_profile_not_found".to_string())
}

fn has_active_vpn_interface() -> bool {
    let Ok(output) = Command::new("ip")
        .args(["-o", "link", "show", "up"])
        .output()
    else {
        return false;
    };

    if !output.status.success() {
        return false;
    }

    let stdout = String::from_utf8_lossy(&output.stdout);

    stdout.lines().any(|line| {
        line.contains(": tun")
            || line.contains(": wg")
            || line.contains(": ppp")
            || line.contains(": tailscale")
            || line.contains(": netmaker")
    })
}

fn run_nmcli_void(args: &[&str]) -> Result<(), String> {
    run_nmcli(args).map(|_| ())
}

fn run_nmcli(args: &[&str]) -> Result<String, String> {
    let output = Command::new(NMCLI)
        .args(args)
        .output()
        .map_err(|error| format!("nmcli_spawn_failed:{error}"))?;

    if output.status.success() {
        return Ok(String::from_utf8_lossy(&output.stdout).trim().to_string());
    }

    let stderr = String::from_utf8_lossy(&output.stderr).trim().to_string();

    Err(if stderr.is_empty() {
        "nmcli_command_failed".to_string()
    } else {
        stderr
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn parse_pair_line_extracts_fields() {
        let parsed = parse_pair_line("vpn:activated").unwrap();

        assert_eq!(parsed.0, "vpn");
        assert_eq!(parsed.1, "activated");
    }

    #[test]
    fn nm_state_maps_to_status() {
        assert_eq!(
            VpnConnectionStatus::from_nm_state("activated"),
            Some(VpnConnectionStatus::Connected)
        );
        assert_eq!(
            VpnConnectionStatus::from_nm_state("activating"),
            Some(VpnConnectionStatus::Connecting)
        );
    }
}
