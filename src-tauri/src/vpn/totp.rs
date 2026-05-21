use std::time::{SystemTime, UNIX_EPOCH};

use data_encoding::BASE32;
use totp_lite::{totp_custom, Sha1, DEFAULT_STEP};

pub fn generate_totp_code(secret_base32: &str) -> Result<String, String> {
    let normalized = secret_base32
        .chars()
        .filter(|ch| !ch.is_whitespace())
        .collect::<String>()
        .to_uppercase();

    if normalized.len() < 16 {
        return Err("totp_secret_too_short".to_string());
    }

    let secret = BASE32
        .decode(normalized.as_bytes())
        .map_err(|_| "totp_secret_invalid".to_string())?;

    let timestamp = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map_err(|_| "totp_time_failed".to_string())?
        .as_secs();

    let code = totp_custom::<Sha1>(DEFAULT_STEP, 6, &secret, timestamp);

    Ok(format!("{code:06}"))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn generates_six_digit_code_for_known_secret() {
        let code = generate_totp_code("JBSWY3DPEHPK3PXP").expect("totp");

        assert_eq!(code.len(), 6);
        assert!(code.chars().all(|ch| ch.is_ascii_digit()));
    }

    #[test]
    fn rejects_short_secret() {
        assert_eq!(
            generate_totp_code("SHORT").expect_err("err"),
            "totp_secret_too_short"
        );
    }
}
