use std::process::Command;

use super::types::{VpnConnectionStatus, VpnProfile};

pub fn get_system_vpn_status() -> Result<VpnConnectionStatus, String> {
    let output = Command::new("scutil")
        .arg("--nc")
        .arg("list")
        .output()
        .map_err(|error| format!("scutil_spawn_failed:{error}"))?;

    if !output.status.success() {
        return Err(String::from_utf8_lossy(&output.stderr).trim().to_string());
    }

    let stdout = String::from_utf8_lossy(&output.stdout);
    let mut connecting = false;

    for line in stdout.lines() {
        let trimmed = line.trim();

        if trimmed.contains("Connected") {
            return Ok(VpnConnectionStatus::Connected);
        }

        if trimmed.contains("Connecting") {
            connecting = true;
        }
    }

    if connecting {
        return Ok(VpnConnectionStatus::Connecting);
    }

    Ok(VpnConnectionStatus::Disconnected)
}

pub fn connect_system_vpn(
    profile_name: &str,
    _auth: Option<&super::credentials::VpnConnectAuth>,
) -> Result<(), String> {
    run_scutil(&["--nc", "start", profile_name])
}

pub fn list_system_vpn_profiles() -> Result<Vec<VpnProfile>, String> {
    let output = Command::new("scutil")
        .arg("--nc")
        .arg("list")
        .output()
        .map_err(|error| format!("scutil_spawn_failed:{error}"))?;

    if !output.status.success() {
        return Err(String::from_utf8_lossy(&output.stderr).trim().to_string());
    }

    let stdout = String::from_utf8_lossy(&output.stdout);

    Ok(stdout.lines().filter_map(parse_scutil_profile).collect())
}

pub fn disconnect_system_vpn(profile_name: Option<&str>) -> Result<(), String> {
    let service = profile_name
        .map(str::to_string)
        .or_else(active_vpn_service)
        .ok_or("vpn_not_connected".to_string())?;

    run_scutil(&["--nc", "stop", &service])
}

fn active_vpn_service() -> Option<String> {
    let output = Command::new("scutil")
        .arg("--nc")
        .arg("list")
        .output()
        .ok()?;

    if !output.status.success() {
        return None;
    }

    let stdout = String::from_utf8_lossy(&output.stdout);

    for line in stdout.lines() {
        if line.contains("Connected") {
            return parse_service_name(line);
        }
    }

    None
}

fn parse_scutil_profile(line: &str) -> Option<VpnProfile> {
    let name = parse_service_name(line)?;
    let status = if line.contains("(Connected)") {
        VpnConnectionStatus::Connected
    } else if line.contains("Connecting") {
        VpnConnectionStatus::Connecting
    } else {
        VpnConnectionStatus::Disconnected
    };

    Some(VpnProfile { name, status })
}

fn parse_service_name(line: &str) -> Option<String> {
    let start = line.find('"')? + 1;
    let end = line[start..].find('"')? + start;

    Some(line[start..end].to_string())
}

fn run_scutil(args: &[&str]) -> Result<(), String> {
    let output = Command::new("scutil")
        .args(args)
        .output()
        .map_err(|error| format!("scutil_spawn_failed:{error}"))?;

    if output.status.success() {
        return Ok(());
    }

    Err(String::from_utf8_lossy(&output.stderr).trim().to_string())
}

pub fn get_system_vpn_profile_username(_profile_name: &str) -> Result<String, String> {
    Ok(String::new())
}
