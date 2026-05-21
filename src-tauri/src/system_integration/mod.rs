use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Manager};
use tauri_plugin_autostart::ManagerExt;

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct SystemIntegrationSettings {
    #[serde(default)]
    pub launch_at_startup: bool,
    #[serde(default)]
    pub launch_minimized: bool,
}

pub fn apply(app: &AppHandle, settings: &SystemIntegrationSettings) -> Result<(), String> {
    let autostart = app.autolaunch();
    let enabled = autostart.is_enabled().map_err(|error| error.to_string())?;

    if settings.launch_at_startup && !enabled {
        autostart.enable().map_err(|error| error.to_string())?;
    } else if !settings.launch_at_startup && enabled {
        autostart.disable().map_err(|error| error.to_string())?;
    }

    Ok(())
}

pub fn apply_launch_minimized(app: &AppHandle, settings: &SystemIntegrationSettings) {
    if !settings.launch_minimized {
        return;
    }

    if let Some(window) = app.get_webview_window("main") {
        let _ = window.hide();
    }
}
