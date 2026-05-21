use std::process::Command;

use super::types::VpnConnectionStatus;

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

pub fn connect_system_vpn() -> Result<(), String> {
    let service = preferred_vpn_service()?;
    run_scutil(&["--nc", "start", &service])
}

pub fn disconnect_system_vpn() -> Result<(), String> {
    let service = active_vpn_service().ok_or("vpn_not_connected".to_string())?;
    run_scutil(&["--nc", "stop", &service])
}

fn preferred_vpn_service() -> Result<String, String> {
    let output = Command::new("scutil")
        .arg("--nc")
        .arg("list")
        .output()
        .map_err(|error| format!("scutil_spawn_failed:{error}"))?;

    parse_first_vpn_service(&String::from_utf8_lossy(&output.stdout))
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

fn parse_first_vpn_service(stdout: &str) -> Result<String, String> {
    for line in stdout.lines() {
        if let Some(name) = parse_service_name(line) {
            return Ok(name);
        }
    }

    Err("vpn_profile_not_found".to_string())
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
