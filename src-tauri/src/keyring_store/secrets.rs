use base64::{engine::general_purpose::STANDARD as BASE64, Engine as _};
use keyring_core::Entry;
use rand::RngCore;
use serde::{Deserialize, Serialize};

const SERVICE: &str = "autovpn";
const USER: &str = "app-lock-secrets";

#[derive(Debug, Clone, Serialize, Deserialize)]
struct StoredSecrets {
    enc_key: String,
    hmac_key: String,
}

pub struct AppLockSecrets {
    pub enc_key: [u8; 32],
    pub hmac_key: [u8; 32],
}

fn secrets_entry() -> Result<Entry, String> {
    Entry::new(SERVICE, USER).map_err(|e| e.to_string())
}

pub fn has_app_lock_secrets() -> Result<bool, String> {
    let entry = secrets_entry()?;

    match entry.get_password() {
        Ok(_) => Ok(true),
        Err(keyring_core::Error::NoEntry) => Ok(false),
        Err(error) => Err(error.to_string()),
    }
}

pub fn load_app_lock_secrets() -> Result<Option<AppLockSecrets>, String> {
    let entry = secrets_entry()?;

    let payload = match entry.get_password() {
        Ok(value) => value,
        Err(keyring_core::Error::NoEntry) => return Ok(None),
        Err(error) => return Err(error.to_string()),
    };

    parse_secrets(&payload).map(Some)
}

pub fn store_app_lock_secrets(enc_key: [u8; 32], hmac_key: [u8; 32]) -> Result<(), String> {
    let stored = StoredSecrets {
        enc_key: BASE64.encode(enc_key),
        hmac_key: BASE64.encode(hmac_key),
    };
    let json = serde_json::to_string(&stored).map_err(|e| e.to_string())?;
    secrets_entry()?
        .set_password(&json)
        .map_err(|e| e.to_string())
}

pub fn remove_app_lock_secrets() -> Result<(), String> {
    match secrets_entry()?.delete_credential() {
        Ok(()) => Ok(()),
        Err(keyring_core::Error::NoEntry) => Ok(()),
        Err(error) => Err(error.to_string()),
    }
}

pub fn generate_app_lock_keys() -> ([u8; 32], [u8; 32]) {
    let mut enc_key = [0u8; 32];
    let mut hmac_key = [0u8; 32];
    rand::thread_rng().fill_bytes(&mut enc_key);
    rand::thread_rng().fill_bytes(&mut hmac_key);
    (enc_key, hmac_key)
}

#[tauri::command]
pub fn init_app_lock_secrets() -> Result<(), String> {
    if has_app_lock_secrets()? {
        return Ok(());
    }

    let (enc_key, hmac_key) = generate_app_lock_keys();
    store_app_lock_secrets(enc_key, hmac_key)
}

#[tauri::command]
pub fn remove_app_lock_secrets_command() -> Result<(), String> {
    remove_app_lock_secrets()
}

fn parse_secrets(payload: &str) -> Result<AppLockSecrets, String> {
    let stored: StoredSecrets = serde_json::from_str(payload).map_err(|e| e.to_string())?;
    let enc_key = decode_key(&stored.enc_key)?;
    let hmac_key = decode_key(&stored.hmac_key)?;

    Ok(AppLockSecrets { enc_key, hmac_key })
}

fn decode_key(value: &str) -> Result<[u8; 32], String> {
    let bytes = BASE64.decode(value).map_err(|e| e.to_string())?;

    if bytes.len() != 32 {
        return Err("invalid_secret_key_length".to_string());
    }

    let mut key = [0u8; 32];
    key.copy_from_slice(&bytes);
    Ok(key)
}
