mod profile;
mod types;

#[cfg(target_os = "linux")]
mod linux;
#[cfg(target_os = "macos")]
mod macos;
#[cfg(target_os = "linux")]
mod nm_monitor;
#[cfg(not(any(target_os = "linux", target_os = "macos", target_os = "windows")))]
mod unsupported;
#[cfg(target_os = "windows")]
mod windows;

pub use types::{VpnConnectionStatus, VpnProfile};

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
    let profile = profile::resolve_default_profile()?;
    platform::connect_system_vpn(&profile)
}

pub fn disconnect_system_vpn() -> Result<(), String> {
    let profile = profile::resolve_disconnect_profile();
    platform::disconnect_system_vpn(profile.as_deref())
}

pub fn list_system_vpn_profiles() -> Result<Vec<VpnProfile>, String> {
    platform::list_system_vpn_profiles()
}

pub fn start_vpn_status_monitor(app: tauri::AppHandle) {
    #[cfg(target_os = "linux")]
    nm_monitor::start(app);
}

async fn run_vpn_task<T>(task: fn() -> Result<T, String>) -> Result<T, String>
where
    T: Send + 'static,
{
    tauri::async_runtime::spawn_blocking(task)
        .await
        .map_err(|error| format!("vpn_task_failed:{error}"))
        .and_then(|result| result)
}

#[tauri::command]
pub async fn get_vpn_status() -> Result<VpnConnectionStatus, String> {
    run_vpn_task(get_system_vpn_status).await
}

#[tauri::command]
pub async fn connect_vpn() -> Result<(), String> {
    run_vpn_task(connect_system_vpn).await
}

#[tauri::command]
pub async fn disconnect_vpn() -> Result<(), String> {
    run_vpn_task(disconnect_system_vpn).await
}

#[tauri::command]
pub async fn get_vpn_profiles() -> Result<Vec<VpnProfile>, String> {
    run_vpn_task(list_system_vpn_profiles).await
}
