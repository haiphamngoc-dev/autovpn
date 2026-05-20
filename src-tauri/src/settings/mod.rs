use std::fs;
use std::path::PathBuf;

use serde::{Deserialize, Serialize};

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
        ..settings
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
}
