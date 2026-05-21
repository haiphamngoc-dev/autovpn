use std::fs;
use std::path::PathBuf;

use serde::{Deserialize, Serialize};

pub use crate::system_integration::SystemIntegrationSettings;
pub use crate::window_behavior::WindowBehaviorSettings;

const APP_CONFIG_DIR: &str = "autovpn";
const SETTINGS_FILE: &str = "settings.json";

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AppearanceSettings {
    #[serde(default = "default_color_scheme")]
    pub color_scheme: String,
    #[serde(default = "default_language")]
    pub language: String,
}

impl Default for AppearanceSettings {
    fn default() -> Self {
        Self {
            color_scheme: default_color_scheme(),
            language: default_language(),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct AppSettings {
    #[serde(default)]
    pub appearance: AppearanceSettings,
    #[serde(default)]
    pub app_lock: AppLockSettings,
    #[serde(default)]
    pub window_behavior: WindowBehaviorSettings,
    #[serde(default)]
    pub system_integration: SystemIntegrationSettings,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AppLockSettings {
    #[serde(default = "default_lock_when_idle")]
    pub lock_when_idle: bool,
    #[serde(default = "default_idle_timeout")]
    pub idle_timeout: String,
}

impl Default for AppLockSettings {
    fn default() -> Self {
        Self {
            lock_when_idle: default_lock_when_idle(),
            idle_timeout: default_idle_timeout(),
        }
    }
}

fn default_lock_when_idle() -> bool {
    true
}

fn default_idle_timeout() -> String {
    "5".to_string()
}

fn default_color_scheme() -> String {
    "dark".to_string()
}

fn default_language() -> String {
    "en".to_string()
}

fn settings_path() -> Result<PathBuf, String> {
    let config_dir = dirs::config_dir().ok_or("Could not determine config directory")?;
    Ok(config_dir.join(APP_CONFIG_DIR).join(SETTINGS_FILE))
}

fn ensure_config_dir(path: &PathBuf) -> Result<(), String> {
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent).map_err(|e| e.to_string())?;
    }
    Ok(())
}

fn sanitize_app_lock(app_lock: AppLockSettings) -> AppLockSettings {
    let idle_timeout = match app_lock.idle_timeout.as_str() {
        "1" | "5" | "15" | "30" | "60" => app_lock.idle_timeout,
        _ => default_idle_timeout(),
    };

    AppLockSettings {
        lock_when_idle: app_lock.lock_when_idle,
        idle_timeout,
    }
}

fn sanitize_appearance(appearance: AppearanceSettings) -> AppearanceSettings {
    let color_scheme = match appearance.color_scheme.as_str() {
        "light" | "dark" => appearance.color_scheme,
        _ => default_color_scheme(),
    };

    let language = match appearance.language.as_str() {
        "en" | "vi" => appearance.language,
        _ => default_language(),
    };

    AppearanceSettings {
        color_scheme,
        language,
    }
}

pub fn load_settings() -> Result<AppSettings, String> {
    let path = settings_path()?;

    if !path.exists() {
        return Ok(AppSettings::default());
    }

    let content = fs::read_to_string(&path).map_err(|e| e.to_string())?;
    let settings: AppSettings = serde_json::from_str(&content).map_err(|e| e.to_string())?;

    Ok(AppSettings {
        appearance: sanitize_appearance(settings.appearance),
        app_lock: sanitize_app_lock(settings.app_lock),
        window_behavior: settings.window_behavior,
        system_integration: settings.system_integration,
    })
}

pub fn save_settings(settings: &AppSettings) -> Result<(), String> {
    let path = settings_path()?;
    ensure_config_dir(&path)?;

    let content = serde_json::to_string_pretty(settings).map_err(|e| e.to_string())?;
    fs::write(path, content).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_appearance_settings() -> Result<AppearanceSettings, String> {
    Ok(load_settings()?.appearance)
}

#[tauri::command]
pub fn save_appearance_settings(appearance: AppearanceSettings) -> Result<(), String> {
    let mut settings = load_settings().unwrap_or_default();
    settings.appearance = sanitize_appearance(appearance);
    save_settings(&settings)
}

#[tauri::command]
pub fn get_app_lock_settings() -> Result<AppLockSettings, String> {
    Ok(load_settings()?.app_lock)
}

#[tauri::command]
pub fn save_app_lock_settings(app_lock: AppLockSettings) -> Result<(), String> {
    let mut settings = load_settings().unwrap_or_default();
    settings.app_lock = sanitize_app_lock(app_lock);
    save_settings(&settings)
}

#[tauri::command]
pub fn get_window_behavior_settings() -> Result<WindowBehaviorSettings, String> {
    Ok(load_settings()?.window_behavior)
}

#[tauri::command]
pub fn save_window_behavior_settings(
    app: tauri::AppHandle,
    window_behavior: WindowBehaviorSettings,
) -> Result<(), String> {
    let mut settings = load_settings().unwrap_or_default();
    settings.window_behavior = window_behavior.clone();
    save_settings(&settings)?;
    crate::window_behavior::apply(&app, &window_behavior)
}

#[tauri::command]
pub fn get_system_integration_settings() -> Result<SystemIntegrationSettings, String> {
    Ok(load_settings()?.system_integration)
}

#[tauri::command]
pub fn save_system_integration_settings(
    app: tauri::AppHandle,
    system_integration: SystemIntegrationSettings,
) -> Result<(), String> {
    let mut settings = load_settings().unwrap_or_default();
    settings.system_integration = system_integration.clone();
    save_settings(&settings)?;
    crate::system_integration::apply(&app, &system_integration)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn deserializes_frontend_appearance_payload() {
        let json = r#"{"colorScheme":"light","language":"vi"}"#;
        let appearance: AppearanceSettings = serde_json::from_str(json).unwrap();

        assert_eq!(appearance.color_scheme, "light");
        assert_eq!(appearance.language, "vi");
    }

    #[test]
    fn serializes_appearance_with_camel_case_color_scheme() {
        let appearance = AppearanceSettings {
            color_scheme: "dark".to_string(),
            language: "en".to_string(),
        };

        let json = serde_json::to_string(&appearance).unwrap();

        assert!(json.contains(r#""colorScheme":"dark""#));
        assert!(json.contains(r#""language":"en""#));
    }

    #[test]
    fn settings_file_uses_nested_appearance_object() {
        let settings = AppSettings {
            appearance: AppearanceSettings {
                color_scheme: "light".to_string(),
                language: "en".to_string(),
            },
            app_lock: AppLockSettings::default(),
            window_behavior: WindowBehaviorSettings::default(),
            system_integration: SystemIntegrationSettings::default(),
        };

        let json = serde_json::to_string_pretty(&settings).unwrap();

        assert!(json.contains("\"appearance\""));
        assert!(json.contains("\"colorScheme\": \"light\""));
    }

    #[test]
    fn sanitize_rejects_invalid_color_scheme() {
        let appearance = AppearanceSettings {
            color_scheme: "auto".to_string(),
            language: "en".to_string(),
        };

        let sanitized = sanitize_appearance(appearance);

        assert_eq!(sanitized.color_scheme, "dark");
    }

    #[test]
    fn deserializes_frontend_app_lock_payload() {
        let json = r#"{"lockWhenIdle":false,"idleTimeout":"15"}"#;
        let app_lock: AppLockSettings = serde_json::from_str(json).unwrap();

        assert!(!app_lock.lock_when_idle);
        assert_eq!(app_lock.idle_timeout, "15");
    }

    #[test]
    fn sanitize_rejects_invalid_idle_timeout() {
        let app_lock = AppLockSettings {
            lock_when_idle: true,
            idle_timeout: "99".to_string(),
        };

        let sanitized = sanitize_app_lock(app_lock);

        assert_eq!(sanitized.idle_timeout, "5");
    }
}
