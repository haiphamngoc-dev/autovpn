use crate::vpn::credentials::VpnConnectAuth;
use crate::vpn::driver::VpnDriver;
use crate::vpn::ipc_client::send_ipc_request;
use crate::vpn::ipc_types::{IpcRequest, IpcResponse};
use crate::vpn::types::{VpnConnectionStatus, VpnProfile};

pub struct DaemonDriver;

impl VpnDriver for DaemonDriver {
    fn connect(&self, profile_name: &str, auth: Option<&VpnConnectAuth>) -> Result<(), String> {
        let settings = crate::settings::load_settings().unwrap_or_default();
        let config = settings
            .vpn
            .profile_config(profile_name)
            .ok_or_else(|| "profile_config_not_found".to_string())?;

        let vpn_type = config.vpn_type.clone();
        let username = if config.username.is_empty() {
            auth.map(|a| a.username.clone())
        } else {
            Some(config.username.clone())
        };

        let config_dir = dirs::config_dir().ok_or_else(|| "config_dir_not_found".to_string())?;
        let ext = if vpn_type == "wireguard" {
            "conf"
        } else {
            "ovpn"
        };
        let filepath = config_dir
            .join("autovpn")
            .join("profiles")
            .join(format!("{}.{}", profile_name, ext));

        let config_content = std::fs::read_to_string(&filepath)
            .map_err(|e| format!("failed_to_read_profile_config: {e}"))?;

        let request = IpcRequest::Connect {
            profile_name: profile_name.to_string(),
            vpn_type,
            config_content,
            username,
            password: auth.map(|a| a.password.clone()),
        };

        tokio::task::block_in_place(|| {
            let res = tauri::async_runtime::block_on(send_ipc_request(request))?;
            match res {
                IpcResponse::Success { .. } => Ok(()),
                IpcResponse::Error { message } => Err(message),
            }
        })
    }

    fn disconnect(&self, profile_name: Option<&str>) -> Result<(), String> {
        let request = IpcRequest::Disconnect {
            profile_name: profile_name.map(|s| s.to_string()),
        };

        tokio::task::block_in_place(|| {
            let res = tauri::async_runtime::block_on(send_ipc_request(request))?;
            match res {
                IpcResponse::Success { .. } => Ok(()),
                IpcResponse::Error { message } => Err(message),
            }
        })
    }

    fn get_status(&self) -> Result<VpnConnectionStatus, String> {
        let request = IpcRequest::GetStatus;
        tokio::task::block_in_place(|| {
            let res = tauri::async_runtime::block_on(send_ipc_request(request))?;
            match res {
                IpcResponse::Success { vpn_status, .. } => Ok(vpn_status),
                IpcResponse::Error { message } => Err(message),
            }
        })
    }

    fn list_profiles(&self) -> Result<Vec<VpnProfile>, String> {
        // For now, list_profiles will list the configurations imported in AppLocalData.
        // We can do this in the client side settings.json, so the driver list_profiles can
        // just read the current settings/profiles.
        // Let's implement reading from settings for list_profiles.
        let settings = crate::settings::load_settings().unwrap_or_default();
        let mut profiles = Vec::new();
        for (name, _) in settings.vpn.profile_configs {
            let status = self
                .get_status()
                .unwrap_or(VpnConnectionStatus::Disconnected);
            profiles.push(VpnProfile { name, status });
        }
        Ok(profiles)
    }

    fn get_profile_username(&self, profile_name: &str) -> Result<String, String> {
        let settings = crate::settings::load_settings().unwrap_or_default();
        let username = settings
            .vpn
            .profile_config(profile_name)
            .map(|c| c.username.clone())
            .unwrap_or_default();
        Ok(username)
    }

    fn start_status_monitor(&self, app: tauri::AppHandle) {
        use tauri::Emitter;
        tauri::async_runtime::spawn(async move {
            let mut last_status = VpnConnectionStatus::Disconnected;
            loop {
                tokio::time::sleep(tokio::time::Duration::from_millis(1500)).await;

                let request = IpcRequest::GetStatus;
                let status = match send_ipc_request(request).await {
                    Ok(IpcResponse::Success { vpn_status, .. }) => vpn_status,
                    _ => VpnConnectionStatus::Disconnected,
                };

                if status != last_status {
                    last_status = status;
                    let _ = app.emit("vpn-status-changed", status);
                    let _ = crate::tray::refresh_tray_menu(&app);
                }
            }
        });
    }
}
