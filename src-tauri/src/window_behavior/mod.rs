use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Manager};

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct WindowBehaviorSettings {
    #[serde(default)]
    pub use_system_window_frame: bool,
    #[serde(default)]
    pub close_to_tray: bool,
}

pub fn apply(app: &AppHandle, settings: &WindowBehaviorSettings) -> Result<(), String> {
    let window = app
        .get_webview_window("main")
        .ok_or_else(|| "main window not found".to_string())?;

    window
        .set_decorations(settings.use_system_window_frame)
        .map_err(|error| error.to_string())
}
