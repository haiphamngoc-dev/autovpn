mod types;

#[cfg(target_os = "linux")]
mod linux;
#[cfg(target_os = "macos")]
mod macos;
#[cfg(not(any(target_os = "linux", target_os = "macos", target_os = "windows")))]
mod unsupported;
#[cfg(target_os = "windows")]
mod windows;

pub use types::VpnConnectionStatus;

#[cfg(target_os = "linux")]
use linux as platform;
#[cfg(target_os = "macos")]
use macos as platform;
#[cfg(not(any(target_os = "linux", target_os = "macos", target_os = "windows")))]
use unsupported as platform;
#[cfg(target_os = "windows")]
use windows as platform;

pub fn get_system_vpn_status() -> Result<VpnConnectionStatus, String> {
    platform::get_system_vpn_status()
}

pub fn connect_system_vpn() -> Result<(), String> {
    platform::connect_system_vpn()
}

pub fn disconnect_system_vpn() -> Result<(), String> {
    platform::disconnect_system_vpn()
}

#[tauri::command]
pub fn get_vpn_status() -> Result<VpnConnectionStatus, String> {
    get_system_vpn_status()
}

#[tauri::command]
pub fn connect_vpn() -> Result<(), String> {
    connect_system_vpn()
}

#[tauri::command]
pub fn disconnect_vpn() -> Result<(), String> {
    disconnect_system_vpn()
}
