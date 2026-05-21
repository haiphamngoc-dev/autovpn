use std::os::windows::process::CommandExt;
use std::process::Command;

use super::types::VpnConnectionStatus;

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

pub fn connect_system_vpn() -> Result<(), String> {
    let name = preferred_vpn_name()?;
    let script = format!("rasdial '{name}'");

    run_cmd(&script)
}

pub fn disconnect_system_vpn() -> Result<(), String> {
    let name = active_vpn_name().ok_or("vpn_not_connected".to_string())?;
    let script = format!("rasdial '{name}' /disconnect");

    run_cmd(&script)
}

fn preferred_vpn_name() -> Result<String, String> {
    let script = r#"
Get-VpnConnection | Select-Object -First 1 -ExpandProperty Name
"#;

    let output = run_powershell(script)?;
    let name = output.lines().map(str::trim).find(|line| !line.is_empty());

    name.map(str::to_string)
        .ok_or("vpn_profile_not_found".to_string())
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
