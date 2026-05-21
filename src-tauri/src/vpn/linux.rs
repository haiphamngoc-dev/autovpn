use std::process::Command;

use super::types::{VpnConnectionStatus, VpnProfile};

const NMCLI: &str = "nmcli";

pub fn get_system_vpn_status() -> Result<VpnConnectionStatus, String> {
    let status = status_from_nmcli()?;

    if has_active_vpn_interface()
        && matches!(
            status,
            VpnConnectionStatus::Disconnected | VpnConnectionStatus::Connecting
        )
    {
        return Ok(VpnConnectionStatus::Connected);
    }

    Ok(status)
}

pub fn connect_system_vpn(profile_name: &str) -> Result<(), String> {
    // Do not block until activation finishes (default nmcli wait is 90s).
    run_nmcli_void_with_wait(&["connection", "up", "id", profile_name], 0)
}

pub fn list_system_vpn_profiles() -> Result<Vec<VpnProfile>, String> {
    let output = run_nmcli(&["-t", "-f", "NAME,TYPE,STATE", "connection", "show"])?;

    Ok(output
        .lines()
        .map(str::trim)
        .filter(|line| !line.is_empty())
        .filter_map(|line| {
            let mut parts = line.split(':');
            let name = parts.next()?;
            let conn_type = parts.next()?;
            let state = parts.next()?;

            if conn_type != "vpn" {
                return None;
            }

            let status = VpnConnectionStatus::from_nm_state(state)
                .unwrap_or(VpnConnectionStatus::Disconnected);

            Some(VpnProfile {
                name: name.to_string(),
                status,
            })
        })
        .collect())
}

pub fn disconnect_system_vpn(profile_name: Option<&str>) -> Result<(), String> {
    if let Some(name) = profile_name {
        return run_nmcli_void(&["connection", "down", "id", name]);
    }

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

fn run_nmcli_void_with_wait(args: &[&str], wait_seconds: u32) -> Result<(), String> {
    run_nmcli_with_wait(args, wait_seconds).map(|_| ())
}

fn run_nmcli(args: &[&str]) -> Result<String, String> {
    let output = Command::new(NMCLI)
        .args(args)
        .output()
        .map_err(|error| format!("nmcli_spawn_failed:{error}"))?;

    map_nmcli_output(output)
}

fn run_nmcli_with_wait(args: &[&str], wait_seconds: u32) -> Result<String, String> {
    let output = Command::new(NMCLI)
        .arg("-w")
        .arg(wait_seconds.to_string())
        .args(args)
        .output()
        .map_err(|error| format!("nmcli_spawn_failed:{error}"))?;

    map_nmcli_output(output)
}

fn map_nmcli_output(output: std::process::Output) -> Result<String, String> {
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
