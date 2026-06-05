use crate::keyring_store::vpn_credentials::{self, PasswordPart, StoredVpnCredentials};
use crate::settings::VpnProfileConfig;

use super::totp;

#[derive(Debug, Clone)]
pub struct VpnConnectAuth {
    pub password: String,
}

pub fn build_connect_password(
    config: &VpnProfileConfig,
    secrets: &StoredVpnCredentials,
) -> Result<String, String> {
    if !secrets.parts.is_empty() {
        let mut final_password = String::new();
        for part in &secrets.parts {
            match part {
                PasswordPart::Static { value } => {
                    final_password.push_str(value);
                }
                PasswordPart::Totp { secret } => {
                    let secret_trimmed = secret.trim();
                    if secret_trimmed.is_empty() {
                        return Err("totp_secret_missing".to_string());
                    }
                    let otp = totp::generate_totp_code(secret_trimmed)?;
                    final_password.push_str(&otp);
                }
            }
        }
        return Ok(final_password);
    }

    if config.use_totp {
        let secret = secrets
            .totp_secret
            .as_deref()
            .filter(|value| !value.is_empty())
            .ok_or("totp_secret_missing".to_string())?;
        let otp = totp::generate_totp_code(secret)?;

        return Ok(format!(
            "{otp}{}",
            secrets.base_password.as_deref().unwrap_or("")
        ));
    }

    Ok(secrets.base_password.clone().unwrap_or_default())
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

    let username = super::platform::get_system_vpn_profile_username(profile_name)?;

    if username.is_empty() {
        return Err("vpn_username_missing".to_string());
    }

    let secrets = vpn_credentials::load_vpn_profile_credentials(profile_name)?
        .ok_or("vpn_credentials_missing".to_string())?;

    let password = build_connect_password(&config, &secrets)?;

    if password.is_empty() {
        return Err("vpn_password_missing".to_string());
    }

    Ok(Some(VpnConnectAuth { password }))
}
