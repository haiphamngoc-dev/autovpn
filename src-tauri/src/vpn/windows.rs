use std::os::windows::process::CommandExt;
use std::process::Command;

use super::types::{VpnConnectionStatus, VpnProfile};

const CREATE_NO_WINDOW: u32 = 0x0800_0000;

pub fn get_system_vpn_status() -> Result<VpnConnectionStatus, String> {
    let script = r#"
Get-VpnConnection | Select-Object -ExpandProperty ConnectionStatus
"#;

    let output = run_powershell(script)?;

    if output
        .lines()
        .any(|line| line.trim().eq_ignore_ascii_case("Connected"))
    {
        return Ok(VpnConnectionStatus::Connected);
    }

    if output
        .lines()
        .any(|line| line.trim().eq_ignore_ascii_case("Connecting"))
    {
        return Ok(VpnConnectionStatus::Connecting);
    }

    Ok(VpnConnectionStatus::Disconnected)
}

pub fn connect_system_vpn(
    profile_name: &str,
    _auth: Option<&super::credentials::VpnConnectAuth>,
) -> Result<(), String> {
    let script = format!("rasdial '{profile_name}'");

    run_cmd(&script)
}

pub fn list_system_vpn_profiles() -> Result<Vec<VpnProfile>, String> {
    let script = r#"
Get-VpnConnection | ForEach-Object { "{0}|{1}" -f $_.Name, $_.ConnectionStatus }
"#;

    let output = run_powershell(script)?;

    Ok(output
        .lines()
        .map(str::trim)
        .filter(|line| !line.is_empty())
        .filter_map(|line| {
            let (name, status) = line.split_once('|')?;
            Some(VpnProfile {
                name: name.to_string(),
                status: map_windows_status(status),
            })
        })
        .collect())
}

pub fn disconnect_system_vpn(profile_name: Option<&str>) -> Result<(), String> {
    let name = profile_name
        .map(str::to_string)
        .or_else(active_vpn_name)
        .ok_or("vpn_not_connected".to_string())?;
    let script = format!("rasdial '{name}' /disconnect");

    run_cmd(&script)
}

fn active_vpn_name() -> Option<String> {
    let script = r#"
Get-VpnConnection | Where-Object ConnectionStatus -eq 'Connected' | Select-Object -First 1 -ExpandProperty Name
"#;

    let output = run_powershell(script).ok()?;
    output
        .lines()
        .map(str::trim)
        .find(|line| !line.is_empty())
        .map(str::to_string)
}

fn run_powershell(script: &str) -> Result<String, String> {
    let output = Command::new("powershell")
        .args([
            "-NoProfile",
            "-NonInteractive",
            "-ExecutionPolicy",
            "Bypass",
            "-Command",
            script,
        ])
        .creation_flags(CREATE_NO_WINDOW)
        .output()
        .map_err(|error| format!("powershell_spawn_failed:{error}"))?;

    if output.status.success() {
        return Ok(String::from_utf8_lossy(&output.stdout).trim().to_string());
    }

    Err(String::from_utf8_lossy(&output.stderr).trim().to_string())
}

fn map_windows_status(value: &str) -> VpnConnectionStatus {
    match value.trim() {
        "Connected" => VpnConnectionStatus::Connected,
        "Connecting" => VpnConnectionStatus::Connecting,
        _ => VpnConnectionStatus::Disconnected,
    }
}

fn run_cmd(script: &str) -> Result<(), String> {
    let output = Command::new("cmd")
        .args(["/C", script])
        .creation_flags(CREATE_NO_WINDOW)
        .output()
        .map_err(|error| format!("cmd_spawn_failed:{error}"))?;

    if output.status.success() {
        return Ok(());
    }

    Err(String::from_utf8_lossy(&output.stderr).trim().to_string())
}
