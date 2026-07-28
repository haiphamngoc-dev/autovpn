mod credentials;
pub(crate) mod daemon_driver;
pub(crate) mod driver;
pub(crate) mod ipc_client;
pub(crate) mod ipc_types;
mod profile;
mod totp;
mod types;

#[cfg(target_os = "linux")]
pub(crate) mod nm_monitor;

pub use types::{VpnConnectionStatus, VpnLogEntry, VpnProfile};

use daemon_driver::DaemonDriver;
use driver::VpnDriver;

pub fn get_driver() -> &'static dyn VpnDriver {
    static DRIVER: DaemonDriver = DaemonDriver;
    &DRIVER
}

pub fn get_system_vpn_status() -> Result<VpnConnectionStatus, String> {
    get_driver().get_status()
}

pub fn connect_system_vpn() -> Result<(), String> {
    let profile = profile::resolve_default_profile()?;
    let auth = credentials::resolve_connect_auth(&profile)?;
    get_driver().connect(&profile, auth.as_ref())
}

pub fn disconnect_system_vpn() -> Result<(), String> {
    let profile = profile::resolve_disconnect_profile();
    get_driver().disconnect(profile.as_deref())
}

pub fn reconnect_system_vpn() -> Result<(), String> {
    let _ = disconnect_system_vpn();
    std::thread::sleep(std::time::Duration::from_millis(1500));
    connect_system_vpn()
}

pub fn list_system_vpn_profiles() -> Result<Vec<VpnProfile>, String> {
    get_driver().list_profiles()
}

pub fn start_vpn_status_monitor(app: tauri::AppHandle) {
    get_driver().start_status_monitor(app);
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
    tauri::async_runtime::spawn_blocking(|| {
        // 1. Get profiles from the system (NetworkManager / platform)
        let mut profiles = list_system_vpn_profiles().unwrap_or_default();
        let system_names: std::collections::HashSet<String> =
            profiles.iter().map(|p| p.name.clone()).collect();

        // 2. Merge app-imported profiles from settings.json
        let settings = crate::settings::load_settings().unwrap_or_default();
        for (name, _config) in &settings.vpn.profile_configs {
            if !system_names.contains(name) {
                profiles.push(VpnProfile {
                    name: name.clone(),
                    status: VpnConnectionStatus::Disconnected,
                });
            }
        }

        Ok(profiles)
    })
    .await
    .map_err(|error| format!("vpn_task_failed:{error}"))?
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
    #[serde(default)]
    pub username: String,
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

    let mut username = get_driver()
        .get_profile_username(profile_name)
        .unwrap_or_default();
    if username.is_empty() {
        username = config.username.clone();
    }
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
    let payload_username = payload.username.trim().to_string();

    if profile_name.is_empty() {
        return Err("vpn_profile_name_required".to_string());
    }

    if payload.parts.is_empty() {
        let mut settings = crate::settings::load_settings().unwrap_or_default();
        let config = settings.vpn.profile_config_mut(&profile_name);
        config.username = payload_username;
        return crate::settings::save_settings(&settings);
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
    if !payload_username.is_empty() {
        config.username = payload_username.clone();
        #[cfg(target_os = "linux")]
        {
            let _ = std::process::Command::new("nmcli")
                .args([
                    "connection",
                    "modify",
                    "id",
                    &profile_name,
                    "vpn.data",
                    &format!("username={payload_username}"),
                    "vpn.user-name",
                    &payload_username,
                ])
                .output();
        }
    }

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
    tauri::async_runtime::spawn_blocking(move || get_driver().get_profile_username(&profile_name))
        .await
        .map_err(|error| format!("vpn_task_failed:{error}"))?
}

#[tauri::command]
pub async fn import_vpn_profile(
    profile_name: String,
    vpn_type: String,
    config_content: String,
    username: String,
) -> Result<(), String> {
    let config_dir =
        dirs::config_dir().ok_or_else(|| "Could not determine config directory".to_string())?;
    let profiles_dir = config_dir.join("autovpn").join("profiles");
    std::fs::create_dir_all(&profiles_dir)
        .map_err(|e| format!("failed to create profiles directory: {e}"))?;

    let ext = match vpn_type.as_str() {
        "wireguard" => "conf",
        "openvpn" => "ovpn",
        _ => return Err("unsupported_vpn_type".to_string()),
    };

    let filename = format!("{}.{}", profile_name, ext);
    let filepath = profiles_dir.join(filename);
    std::fs::write(&filepath, config_content)
        .map_err(|e| format!("failed to write config file: {e}"))?;

    let mut settings = crate::settings::load_settings().unwrap_or_default();
    let config = settings.vpn.profile_config_mut(&profile_name);
    config.vpn_type = vpn_type;
    config.username = username;
    config.has_credentials = false;

    crate::settings::save_settings(&settings)?;
    Ok(())
}

#[tauri::command]
pub async fn delete_vpn_profile(app: tauri::AppHandle, profile_name: String) -> Result<(), String> {
    let mut settings = crate::settings::load_settings().unwrap_or_default();
    let vpn_type = if let Some(config) = settings.vpn.profile_config(&profile_name) {
        config.vpn_type.clone()
    } else {
        "openvpn".to_string()
    };

    let config_dir =
        dirs::config_dir().ok_or_else(|| "Could not determine config directory".to_string())?;
    let profiles_dir = config_dir.join("autovpn").join("profiles");
    let ext = match vpn_type.as_str() {
        "wireguard" => "conf",
        _ => "ovpn",
    };
    let filename = format!("{}.{}", profile_name, ext);
    let filepath = profiles_dir.join(filename);
    if filepath.exists() {
        let _ = std::fs::remove_file(filepath);
    }

    let _ = crate::keyring_store::vpn_credentials::remove_vpn_profile_credentials(&profile_name);

    settings.vpn.profile_configs.remove(&profile_name);
    if settings.vpn.default_profile.as_ref() == Some(&profile_name) {
        settings.vpn.default_profile = None;
    }
    crate::settings::save_settings(&settings)?;

    let _ = crate::tray::refresh_tray_menu(&app);

    Ok(())
}
