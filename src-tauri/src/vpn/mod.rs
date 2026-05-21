mod credentials;
mod profile;
mod totp;
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
    let auth = credentials::resolve_connect_auth(&profile)?;
    platform::connect_system_vpn(&profile, auth.as_ref())
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

#[derive(serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct VpnProfileCredentialsView {
    pub username: String,
    pub use_totp: bool,
    pub base_password: String,
    pub totp_secret: String,
    pub has_base_password: bool,
    pub has_totp_secret: bool,
}

#[derive(serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SaveVpnProfileCredentialsPayload {
    pub profile_name: String,
    pub username: String,
    pub use_totp: bool,
    pub base_password: Option<String>,
    pub totp_secret: Option<String>,
}

fn get_profile_credentials_view(profile_name: &str) -> Result<VpnProfileCredentialsView, String> {
    let settings = crate::settings::load_settings().unwrap_or_default();
    let config = settings
        .vpn
        .profile_config(profile_name)
        .cloned()
        .unwrap_or_default();
    let stored = crate::keyring_store::vpn_credentials::load_vpn_profile_credentials(profile_name)?
        .unwrap_or_default();

    let totp_secret = stored.totp_secret.clone().unwrap_or_default();

    Ok(VpnProfileCredentialsView {
        username: config.username.unwrap_or_default(),
        use_totp: config.use_totp,
        base_password: stored.base_password.clone(),
        totp_secret: totp_secret.clone(),
        has_base_password: !stored.base_password.is_empty(),
        has_totp_secret: !totp_secret.is_empty(),
    })
}

fn save_profile_credentials(payload: SaveVpnProfileCredentialsPayload) -> Result<(), String> {
    let profile_name = payload.profile_name.trim().to_string();

    if profile_name.is_empty() {
        return Err("vpn_profile_name_required".to_string());
    }

    let username = payload.username.trim().to_string();

    if username.is_empty() {
        return Err("vpn_username_required".to_string());
    }

    let mut stored = crate::keyring_store::vpn_credentials::load_vpn_profile_credentials(&profile_name)?
        .unwrap_or_default();

    if let Some(base_password) = payload.base_password {
        stored.base_password = base_password;
    }

    if payload.use_totp {
        if let Some(secret) = payload
            .totp_secret
            .map(|value| value.trim().to_string())
            .filter(|value| !value.is_empty())
        {
            totp::generate_totp_code(&secret)?;
            stored.totp_secret = Some(secret);
        } else if stored
            .totp_secret
            .as_ref()
            .is_none_or(|value| value.is_empty())
        {
            return Err("totp_secret_required".to_string());
        }
    } else {
        stored.totp_secret = None;

        if stored.base_password.is_empty() {
            return Err("vpn_password_required".to_string());
        }
    }

    let preview_config = crate::settings::VpnProfileConfig {
        username: Some(username.clone()),
        use_totp: payload.use_totp,
        has_credentials: true,
    };
    credentials::build_connect_password(&preview_config, &stored)?;

    crate::keyring_store::vpn_credentials::store_vpn_profile_credentials(&profile_name, &stored)?;

    let mut settings = crate::settings::load_settings().unwrap_or_default();
    let config = settings.vpn.profile_config_mut(&profile_name);
    config.username = Some(username);
    config.use_totp = payload.use_totp;
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
        config.username = None;
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
