use keyring_core::Entry;
use serde::{Deserialize, Serialize};

use super::SERVICE;

const USER_PREFIX: &str = "vpn-profile:";

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct StoredVpnCredentials {
    #[serde(default)]
    pub base_password: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub totp_secret: Option<String>,
}

fn profile_entry(profile_name: &str) -> Result<Entry, String> {
    let user = format!("{USER_PREFIX}{}", sanitize_profile_key(profile_name));
    Entry::new(SERVICE, &user).map_err(|error| error.to_string())
}

fn sanitize_profile_key(profile_name: &str) -> String {
    profile_name
        .chars()
        .map(|ch| {
            if ch.is_ascii_alphanumeric() || matches!(ch, '-' | '_' | '.') {
                ch
            } else {
                '_'
            }
        })
        .collect()
}

pub fn has_vpn_profile_credentials(profile_name: &str) -> Result<bool, String> {
    let entry = profile_entry(profile_name)?;

    match entry.get_password() {
        Ok(_) => Ok(true),
        Err(keyring_core::Error::NoEntry) => Ok(false),
        Err(error) => Err(error.to_string()),
    }
}

pub fn load_vpn_profile_credentials(
    profile_name: &str,
) -> Result<Option<StoredVpnCredentials>, String> {
    let entry = profile_entry(profile_name)?;

    match entry.get_password() {
        Ok(raw) => {
            let parsed: StoredVpnCredentials =
                serde_json::from_str(&raw).map_err(|error| error.to_string())?;
            Ok(Some(parsed))
        }
        Err(keyring_core::Error::NoEntry) => Ok(None),
        Err(error) => Err(error.to_string()),
    }
}

pub fn store_vpn_profile_credentials(
    profile_name: &str,
    credentials: &StoredVpnCredentials,
) -> Result<(), String> {
    let payload = serde_json::to_string(credentials).map_err(|error| error.to_string())?;
    profile_entry(profile_name)?
        .set_password(&payload)
        .map_err(|error| error.to_string())
}

pub fn remove_vpn_profile_credentials(profile_name: &str) -> Result<(), String> {
    match profile_entry(profile_name)?.delete_credential() {
        Ok(()) => Ok(()),
        Err(keyring_core::Error::NoEntry) => Ok(()),
        Err(error) => Err(error.to_string()),
    }
}
