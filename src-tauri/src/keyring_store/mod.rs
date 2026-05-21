mod secrets;
pub mod vpn_credentials;

pub use secrets::{
    init_app_lock_secrets, load_app_lock_secrets, remove_app_lock_secrets_command, AppLockSecrets,
};

use keyring_core::Entry;

pub(crate) const SERVICE: &str = "autovpn";
const USER: &str = "app-lock-pin";
const MIN_PIN_LENGTH: usize = 4;
const MAX_PIN_LENGTH: usize = 128;

pub fn init() -> Result<(), String> {
    #[cfg(target_os = "linux")]
    {
        keyring_core::set_default_store(
            dbus_secret_service_keyring_store::Store::new().map_err(|e| e.to_string())?,
        );
        return Ok(());
    }

    #[cfg(target_os = "windows")]
    {
        keyring_core::set_default_store(
            windows_native_keyring_store::Store::new().map_err(|e| e.to_string())?,
        );
        return Ok(());
    }

    #[cfg(target_os = "macos")]
    {
        keyring_core::set_default_store(
            apple_native_keyring_store::Store::new().map_err(|e| e.to_string())?,
        );
        return Ok(());
    }

    #[cfg(not(any(target_os = "linux", target_os = "windows", target_os = "macos")))]
    {
        Err("Keyring is not supported on this platform".to_string())
    }
}

fn pin_entry() -> Result<Entry, String> {
    Entry::new(SERVICE, USER).map_err(|e| e.to_string())
}

fn validate_pin(pin: &str) -> Result<(), String> {
    if pin.len() < MIN_PIN_LENGTH || pin.len() > MAX_PIN_LENGTH {
        return Err("pin_invalid_length".to_string());
    }

    Ok(())
}

#[tauri::command]
pub fn has_app_lock_pin() -> Result<bool, String> {
    let entry = pin_entry()?;

    match entry.get_password() {
        Ok(_) => Ok(true),
        Err(keyring_core::Error::NoEntry) => Ok(false),
        Err(error) => Err(error.to_string()),
    }
}

#[tauri::command]
pub fn set_app_lock_pin(pin: String) -> Result<(), String> {
    validate_pin(&pin)?;
    pin_entry()?.set_password(&pin).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn verify_app_lock_pin(pin: String) -> Result<bool, String> {
    let entry = pin_entry()?;

    match entry.get_password() {
        Ok(stored) => Ok(stored == pin),
        Err(keyring_core::Error::NoEntry) => Ok(false),
        Err(error) => Err(error.to_string()),
    }
}

#[tauri::command]
pub fn remove_app_lock_pin() -> Result<(), String> {
    match pin_entry()?.delete_credential() {
        Ok(()) => Ok(()),
        Err(keyring_core::Error::NoEntry) => Ok(()),
        Err(error) => Err(error.to_string()),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn validate_pin_rejects_short_pin() {
        assert!(validate_pin("123").is_err());
    }

    #[test]
    fn validate_pin_rejects_long_pin() {
        assert!(validate_pin(&"a".repeat(MAX_PIN_LENGTH + 1)).is_err());
    }

    #[test]
    fn validate_pin_accepts_digits_only() {
        assert!(validate_pin("1234").is_ok());
    }

    #[test]
    fn validate_pin_accepts_mixed_characters() {
        assert!(validate_pin("Abc1!@#").is_ok());
    }
}
