mod secure;

use std::fs;
use std::path::PathBuf;

use serde::{Deserialize, Serialize};

use crate::keyring_store::{
    has_app_lock_pin, init_app_lock_secrets, load_app_lock_secrets, AppLockSecrets,
};
use secure::{open, seal, SecureEnvelope, SensitiveSettings};

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

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AppLockSettings {
    pub enabled: bool,
    pub lock_when_idle: bool,
    pub idle_timeout: String,
}

impl Default for AppLockSettings {
    fn default() -> Self {
        Self {
            enabled: false,
            lock_when_idle: default_lock_when_idle(),
            idle_timeout: default_idle_timeout(),
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

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
struct PersistedSettingsFile {
    #[serde(default)]
    appearance: AppearanceSettings,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    app_lock: Option<LegacyAppLockSettings>,
    #[serde(default)]
    window_behavior: WindowBehaviorSettings,
    #[serde(default)]
    system_integration: SystemIntegrationSettings,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    secure: Option<SecureEnvelope>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct LegacyAppLockSettings {
    #[serde(default)]
    enabled: bool,
    #[serde(default = "default_lock_when_idle")]
    lock_when_idle: bool,
    #[serde(default = "default_idle_timeout")]
    idle_timeout: String,
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

fn sanitize_app_lock(app_lock: AppLockSettings, enrolled: bool) -> AppLockSettings {
    let idle_timeout = match app_lock.idle_timeout.as_str() {
        "1" | "5" | "15" | "30" | "60" => app_lock.idle_timeout,
        _ => default_idle_timeout(),
    };

    AppLockSettings {
        enabled: enrolled,
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

fn is_enrolled() -> bool {
    has_app_lock_pin().unwrap_or(false)
}

fn ensure_secrets() -> Result<AppLockSecrets, String> {
    if let Some(secrets) = load_app_lock_secrets()? {
        return Ok(secrets);
    }

    init_app_lock_secrets()?;
    load_app_lock_secrets()?.ok_or("app_lock_secrets_missing".to_string())
}

fn sensitive_from_app_lock(app_lock: &AppLockSettings) -> SensitiveSettings {
    SensitiveSettings {
        lock_when_idle: app_lock.lock_when_idle,
        idle_timeout: app_lock.idle_timeout.clone(),
    }
}

fn app_lock_from_sensitive(sensitive: SensitiveSettings, enrolled: bool) -> AppLockSettings {
    sanitize_app_lock(
        AppLockSettings {
            enabled: enrolled,
            lock_when_idle: sensitive.lock_when_idle,
            idle_timeout: sensitive.idle_timeout,
        },
        enrolled,
    )
}

fn read_persisted_file() -> Result<PersistedSettingsFile, String> {
    let path = settings_path()?;

    if !path.exists() {
        return Ok(PersistedSettingsFile::default());
    }

    let content = fs::read_to_string(&path).map_err(|e| e.to_string())?;
    serde_json::from_str(&content).map_err(|e| e.to_string())
}

fn resolve_app_lock(
    file: &PersistedSettingsFile,
    enrolled: bool,
) -> Result<AppLockSettings, String> {
    if !enrolled {
        let legacy = file.app_lock.as_ref();
        return Ok(sanitize_app_lock(
            AppLockSettings {
                enabled: false,
                lock_when_idle: legacy
                    .map(|value| value.lock_when_idle)
                    .unwrap_or(default_lock_when_idle()),
                idle_timeout: legacy
                    .map(|value| value.idle_timeout.clone())
                    .unwrap_or_else(default_idle_timeout),
            },
            false,
        ));
    }

    if let Some(envelope) = &file.secure {
        let secrets = ensure_secrets()?;
        let sensitive = open(envelope, &secrets.enc_key, &secrets.hmac_key)?;
        return Ok(app_lock_from_sensitive(sensitive, true));
    }

    if let Some(legacy) = &file.app_lock {
        return Ok(sanitize_app_lock(
            AppLockSettings {
                enabled: true,
                lock_when_idle: legacy.lock_when_idle,
                idle_timeout: legacy.idle_timeout.clone(),
            },
            true,
        ));
    }

    Ok(AppLockSettings {
        enabled: true,
        lock_when_idle: default_lock_when_idle(),
        idle_timeout: default_idle_timeout(),
    })
}

pub fn load_settings() -> Result<AppSettings, String> {
    let file = read_persisted_file()?;
    let enrolled = is_enrolled();
    let app_lock = resolve_app_lock(&file, enrolled)?;

    Ok(AppSettings {
        appearance: sanitize_appearance(file.appearance),
        app_lock,
        window_behavior: file.window_behavior,
        system_integration: file.system_integration,
    })
}

fn build_persisted_file(settings: &AppSettings) -> Result<PersistedSettingsFile, String> {
    let enrolled = is_enrolled();

    let mut file = PersistedSettingsFile {
        appearance: settings.appearance.clone(),
        app_lock: None,
        window_behavior: settings.window_behavior.clone(),
        system_integration: settings.system_integration.clone(),
        secure: None,
    };

    if enrolled {
        let secrets = ensure_secrets()?;
        let sensitive = sensitive_from_app_lock(&settings.app_lock);
        file.secure = Some(seal(&sensitive, &secrets.enc_key, &secrets.hmac_key)?);
    }

    Ok(file)
}

pub fn save_settings(settings: &AppSettings) -> Result<(), String> {
    let path = settings_path()?;
    ensure_config_dir(&path)?;

    let enrolled = is_enrolled();
    let sanitized = AppSettings {
        appearance: sanitize_appearance(settings.appearance.clone()),
        app_lock: sanitize_app_lock(settings.app_lock.clone(), enrolled),
        window_behavior: settings.window_behavior.clone(),
        system_integration: settings.system_integration.clone(),
    };

    let file = build_persisted_file(&sanitized)?;
    let content = serde_json::to_string_pretty(&file).map_err(|e| e.to_string())?;
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

    if !is_enrolled() {
        settings.app_lock = AppLockSettings::default();
        return save_settings(&settings);
    }

    settings.app_lock = sanitize_app_lock(
        AppLockSettings {
            enabled: true,
            lock_when_idle: app_lock.lock_when_idle,
            idle_timeout: app_lock.idle_timeout,
        },
        true,
    );
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
    fn sanitize_rejects_invalid_color_scheme() {
        let appearance = AppearanceSettings {
            color_scheme: "auto".to_string(),
            language: "en".to_string(),
        };

        let sanitized = sanitize_appearance(appearance);

        assert_eq!(sanitized.color_scheme, "dark");
    }

    #[test]
    fn deserializes_legacy_app_lock_payload() {
        let json = r#"{"enabled":false,"lockWhenIdle":false,"idleTimeout":"15"}"#;
        let app_lock: LegacyAppLockSettings = serde_json::from_str(json).unwrap();

        assert!(!app_lock.enabled);
        assert!(!app_lock.lock_when_idle);
        assert_eq!(app_lock.idle_timeout, "15");
    }

    #[test]
    fn sanitize_rejects_invalid_idle_timeout() {
        let app_lock = AppLockSettings {
            enabled: true,
            lock_when_idle: true,
            idle_timeout: "99".to_string(),
        };

        let sanitized = sanitize_app_lock(app_lock, true);

        assert_eq!(sanitized.idle_timeout, "5");
        assert!(sanitized.enabled);
    }

    #[test]
    fn persisted_file_omits_plaintext_app_lock_when_secure_present() {
        let sensitive = SensitiveSettings {
            lock_when_idle: true,
            idle_timeout: "5".to_string(),
        };
        let enc_key = [7u8; 32];
        let hmac_key = [9u8; 32];
        let envelope = seal(&sensitive, &enc_key, &hmac_key).unwrap();

        let file = PersistedSettingsFile {
            appearance: AppearanceSettings::default(),
            app_lock: None,
            window_behavior: WindowBehaviorSettings::default(),
            system_integration: SystemIntegrationSettings::default(),
            secure: Some(envelope),
        };

        let json = serde_json::to_string_pretty(&file).unwrap();

        assert!(!json.contains("\"appLock\""));
        assert!(json.contains("\"secure\""));
    }
}
