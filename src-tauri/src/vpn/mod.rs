mod credentials;
mod profile;
mod totp;
mod types;

#[cfg(target_os = "linux")]
pub(crate) mod linux;
#[cfg(target_os = "macos")]
pub(crate) mod macos;
#[cfg(target_os = "linux")]
pub(crate) mod nm_monitor;
#[cfg(not(any(target_os = "linux", target_os = "macos", target_os = "windows")))]
pub(crate) mod unsupported;
#[cfg(target_os = "windows")]
pub(crate) mod windows;

pub use types::{VpnConnectionStatus, VpnLogEntry, VpnProfile};

#[cfg(target_os = "linux")]
pub(crate) use linux as platform;
#[cfg(target_os = "macos")]
pub(crate) use macos as platform;
#[cfg(not(any(target_os = "linux", target_os = "macos", target_os = "windows")))]
pub(crate) use unsupported as platform;
#[cfg(target_os = "windows")]
pub(crate) use windows as platform;

pub fn get_system_vpn_status() -> Result<VpnConnectionStatus, String> {
    platform::get_system_vpn_status()
}

pub fn connect_system_vpn() -> Result<(), String> {
    let profile = profile::resolve_default_profile()?;
    let auth = credentials::resolve_connect_auth(&profile)?;
    platform::connect_system_vpn(&profile, auth.as_ref())
}

pub fn disconnect_system_vpn() -> Result<(), String> {
    let profile = profile::resolve_disconnect_profile();
    platform::disconnect_system_vpn(profile.as_deref())
}

pub fn reconnect_system_vpn() -> Result<(), String> {
    let _ = disconnect_system_vpn();
    std::thread::sleep(std::time::Duration::from_millis(1500));
    connect_system_vpn()
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
pub async fn connect_vpn(app: tauri::AppHandle) -> Result<(), String> {
    #[cfg(target_os = "linux")]
    {
        nm_monitor::set_intended_active(true);
        nm_monitor::emit_vpn_log(
            &app,
            "info",
            "AutoVPN",
            "Initiating VPN connection process...",
        );
    }

    match run_vpn_task(connect_system_vpn).await {
        Ok(_) => {
            #[cfg(target_os = "linux")]
            nm_monitor::emit_vpn_log(
                &app,
                "success",
                "AutoVPN",
                "VPN connection request completed successfully.",
            );
            Ok(())
        }
        Err(err) => {
            #[cfg(target_os = "linux")]
            nm_monitor::emit_vpn_log(
                &app,
                "error",
                "AutoVPN",
                &format!("VPN connection failed: {}", err),
            );
            Err(err)
        }
    }
}

#[tauri::command]
pub async fn disconnect_vpn(app: tauri::AppHandle) -> Result<(), String> {
    #[cfg(target_os = "linux")]
    {
        nm_monitor::set_intended_active(false);
        nm_monitor::emit_vpn_log(
            &app,
            "info",
            "AutoVPN",
            "Initiating VPN disconnection process...",
        );
    }

    match run_vpn_task(disconnect_system_vpn).await {
        Ok(_) => {
            #[cfg(target_os = "linux")]
            nm_monitor::emit_vpn_log(
                &app,
                "success",
                "AutoVPN",
                "VPN disconnection request completed successfully.",
            );
            Ok(())
        }
        Err(err) => {
            #[cfg(target_os = "linux")]
            nm_monitor::emit_vpn_log(
                &app,
                "error",
                "AutoVPN",
                &format!("VPN disconnection failed: {}", err),
            );
            Err(err)
        }
    }
}

#[tauri::command]
pub async fn reconnect_vpn(app: tauri::AppHandle) -> Result<(), String> {
    #[cfg(target_os = "linux")]
    {
        nm_monitor::set_intended_active(true);
        nm_monitor::emit_vpn_log(
            &app,
            "info",
            "AutoVPN",
            "Initiating VPN reconnection process...",
        );
    }

    match run_vpn_task(reconnect_system_vpn).await {
        Ok(_) => {
            #[cfg(target_os = "linux")]
            nm_monitor::emit_vpn_log(
                &app,
                "success",
                "AutoVPN",
                "VPN reconnection process finished.",
            );
            Ok(())
        }
        Err(err) => {
            #[cfg(target_os = "linux")]
            nm_monitor::emit_vpn_log(
                &app,
                "error",
                "AutoVPN",
                &format!("VPN reconnection failed: {}", err),
            );
            Err(err)
        }
    }
}

#[tauri::command]
pub async fn get_vpn_profiles() -> Result<Vec<VpnProfile>, String> {
    run_vpn_task(list_system_vpn_profiles).await
}

#[tauri::command]
pub async fn get_vpn_logs() -> Result<Vec<VpnLogEntry>, String> {
    #[cfg(target_os = "linux")]
    {
        Ok(nm_monitor::get_buffered_logs())
    }
    #[cfg(not(target_os = "linux"))]
    {
        Ok(Vec::new())
    }
}

use crate::keyring_store::vpn_credentials::{PasswordPart, StoredVpnCredentials};

#[derive(serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct VpnProfileCredentialsView {
    pub username: String,
    pub parts: Vec<PasswordPart>,
    pub has_stored_credentials: bool,
}

#[derive(serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SaveVpnProfileCredentialsPayload {
    pub profile_name: String,
    pub parts: Vec<PasswordPart>,
}

fn get_profile_credentials_view(profile_name: &str) -> Result<VpnProfileCredentialsView, String> {
    let settings = crate::settings::load_settings().unwrap_or_default();
    let config = settings
        .vpn
        .profile_config(profile_name)
        .cloned()
        .unwrap_or_default();
    let mut stored =
        crate::keyring_store::vpn_credentials::load_vpn_profile_credentials(profile_name)?
            .unwrap_or_default();

    if stored.parts.is_empty() {
        if config.use_totp {
            if let Some(secret) = stored.totp_secret.clone().filter(|s| !s.is_empty()) {
                stored.parts.push(PasswordPart::Totp { secret });
            }
            if let Some(base) = stored.base_password.clone().filter(|b| !b.is_empty()) {
                stored.parts.push(PasswordPart::Static { value: base });
            }
        } else if let Some(base) = stored.base_password.clone().filter(|b| !b.is_empty()) {
            stored.parts.push(PasswordPart::Static { value: base });
        }
    }

    let username = platform::get_system_vpn_profile_username(profile_name).unwrap_or_default();
    let has_stored_credentials = !stored.parts.is_empty()
        || stored.base_password.as_ref().is_some_and(|p| !p.is_empty())
        || stored.totp_secret.as_ref().is_some_and(|s| !s.is_empty());

    Ok(VpnProfileCredentialsView {
        username,
        parts: stored.parts,
        has_stored_credentials,
    })
}

fn save_profile_credentials(payload: SaveVpnProfileCredentialsPayload) -> Result<(), String> {
    let profile_name = payload.profile_name.trim().to_string();

    if profile_name.is_empty() {
        return Err("vpn_profile_name_required".to_string());
    }

    if payload.parts.is_empty() {
        return Err("vpn_password_required".to_string());
    }

    for part in &payload.parts {
        match part {
            PasswordPart::Static { value } => {
                if value.is_empty() {
                    return Err("vpn_password_required".to_string());
                }
            }
            PasswordPart::Totp { secret } => {
                let secret_trimmed = secret.trim();
                if secret_trimmed.is_empty() {
                    return Err("totp_secret_required".to_string());
                }
                totp::generate_totp_code(secret_trimmed)?;
            }
        }
    }

    let use_totp = payload
        .parts
        .iter()
        .any(|part| matches!(part, PasswordPart::Totp { .. }));

    let stored = StoredVpnCredentials {
        parts: payload.parts,
        base_password: None,
        totp_secret: None,
    };

    crate::keyring_store::vpn_credentials::store_vpn_profile_credentials(&profile_name, &stored)?;

    let mut settings = crate::settings::load_settings().unwrap_or_default();
    let config = settings.vpn.profile_config_mut(&profile_name);
    config.use_totp = use_totp;
    config.has_credentials = true;

    crate::settings::save_settings(&settings)
}

fn remove_profile_credentials(profile_name: &str) -> Result<(), String> {
    let profile_name = profile_name.trim().to_string();

    if profile_name.is_empty() {
        return Err("vpn_profile_name_required".to_string());
    }

    crate::keyring_store::vpn_credentials::remove_vpn_profile_credentials(&profile_name)?;

    let mut settings = crate::settings::load_settings().unwrap_or_default();

    if let Some(config) = settings.vpn.profile_configs.get_mut(&profile_name) {
        config.use_totp = false;
        config.has_credentials = false;
    }

    crate::settings::save_settings(&settings)
}

#[tauri::command]
pub async fn get_vpn_profile_credentials(
    profile_name: String,
) -> Result<VpnProfileCredentialsView, String> {
    tauri::async_runtime::spawn_blocking(move || get_profile_credentials_view(&profile_name))
        .await
        .map_err(|error| format!("vpn_task_failed:{error}"))?
}

#[tauri::command]
pub async fn save_vpn_profile_credentials(
    payload: SaveVpnProfileCredentialsPayload,
) -> Result<(), String> {
    tauri::async_runtime::spawn_blocking(move || save_profile_credentials(payload))
        .await
        .map_err(|error| format!("vpn_task_failed:{error}"))?
}

#[tauri::command]
pub async fn remove_vpn_profile_credentials(profile_name: String) -> Result<(), String> {
    tauri::async_runtime::spawn_blocking(move || remove_profile_credentials(&profile_name))
        .await
        .map_err(|error| format!("vpn_task_failed:{error}"))?
}

#[tauri::command]
pub async fn get_system_vpn_profile_username(profile_name: String) -> Result<String, String> {
    tauri::async_runtime::spawn_blocking(move || {
        platform::get_system_vpn_profile_username(&profile_name)
    })
    .await
    .map_err(|error| format!("vpn_task_failed:{error}"))?
}
