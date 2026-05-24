use crate::keyring_store::vpn_credentials::{self, StoredVpnCredentials};
use crate::settings::VpnProfileConfig;

use super::totp;

#[derive(Debug, Clone)]
pub struct VpnConnectAuth {
    #[allow(dead_code)]
    pub username: String,
    pub password: String,
}

pub fn build_connect_password(
    config: &VpnProfileConfig,
    secrets: &StoredVpnCredentials,
) -> Result<String, String> {
    if config.use_totp {
        let secret = secrets
            .totp_secret
            .as_deref()
            .filter(|value| !value.is_empty())
            .ok_or("totp_secret_missing".to_string())?;
        let otp = totp::generate_totp_code(secret)?;

        return Ok(format!("{otp}{}", secrets.base_password));
    }

    Ok(secrets.base_password.clone())
}

pub fn resolve_connect_auth(profile_name: &str) -> Result<Option<VpnConnectAuth>, String> {
    let settings = crate::settings::load_settings().unwrap_or_default();
    let config = settings
        .vpn
        .profile_config(profile_name)
        .cloned()
        .filter(|config| config.has_credentials);

    let Some(config) = config else {
        return Ok(None);
    };

    let username = config
        .username
        .as_deref()
        .filter(|value| !value.is_empty())
        .ok_or("vpn_username_missing".to_string())?
        .to_string();

    let secrets = vpn_credentials::load_vpn_profile_credentials(profile_name)?
        .ok_or("vpn_credentials_missing".to_string())?;

    let password = build_connect_password(&config, &secrets)?;

    if password.is_empty() {
        return Err("vpn_password_missing".to_string());
    }

    Ok(Some(VpnConnectAuth { username, password }))
}
