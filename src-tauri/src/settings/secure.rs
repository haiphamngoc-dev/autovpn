use aes_gcm::{
    aead::{Aead, KeyInit, OsRng},
    Aes256Gcm, Nonce,
};
use base64::{engine::general_purpose::STANDARD as BASE64, Engine as _};
use hmac::{Hmac, Mac};
use rand::RngCore;
use serde::{Deserialize, Serialize};
use sha2::Sha256;

const ENVELOPE_VERSION: u32 = 1;
const NONCE_LEN: usize = 12;

type HmacSha256 = Hmac<Sha256>;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SecureEnvelope {
    pub version: u32,
    pub nonce: String,
    pub ciphertext: String,
    pub mac: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SensitiveSettings {
    pub lock_when_idle: bool,
    pub idle_timeout: String,
}

pub fn seal(
    sensitive: &SensitiveSettings,
    enc_key: &[u8; 32],
    hmac_key: &[u8; 32],
) -> Result<SecureEnvelope, String> {
    let plaintext = serde_json::to_vec(sensitive).map_err(|e| e.to_string())?;
    let cipher = Aes256Gcm::new_from_slice(enc_key).map_err(|e| e.to_string())?;
    let mut nonce_bytes = [0u8; NONCE_LEN];
    OsRng.fill_bytes(&mut nonce_bytes);
    let nonce = Nonce::from_slice(&nonce_bytes);
    let ciphertext = cipher
        .encrypt(nonce, plaintext.as_ref())
        .map_err(|e| e.to_string())?;

    let mac = compute_mac(hmac_key, &ciphertext)?;

    Ok(SecureEnvelope {
        version: ENVELOPE_VERSION,
        nonce: BASE64.encode(nonce_bytes),
        ciphertext: BASE64.encode(ciphertext),
        mac: BASE64.encode(mac),
    })
}

pub fn open(
    envelope: &SecureEnvelope,
    enc_key: &[u8; 32],
    hmac_key: &[u8; 32],
) -> Result<SensitiveSettings, String> {
    if envelope.version != ENVELOPE_VERSION {
        return Err("settings_tampered".to_string());
    }

    let ciphertext = BASE64
        .decode(&envelope.ciphertext)
        .map_err(|_| "settings_tampered".to_string())?;
    let nonce_bytes = BASE64
        .decode(&envelope.nonce)
        .map_err(|_| "settings_tampered".to_string())?;
    let mac = BASE64
        .decode(&envelope.mac)
        .map_err(|_| "settings_tampered".to_string())?;

    verify_mac(hmac_key, &ciphertext, &mac)?;

    if nonce_bytes.len() != NONCE_LEN {
        return Err("settings_tampered".to_string());
    }

    let cipher = Aes256Gcm::new_from_slice(enc_key).map_err(|e| e.to_string())?;
    let nonce = Nonce::from_slice(&nonce_bytes);
    let plaintext = cipher
        .decrypt(nonce, ciphertext.as_ref())
        .map_err(|_| "settings_tampered".to_string())?;

    serde_json::from_slice(&plaintext).map_err(|_| "settings_tampered".to_string())
}

fn compute_mac(hmac_key: &[u8; 32], ciphertext: &[u8]) -> Result<Vec<u8>, String> {
    let mut mac = <HmacSha256 as Mac>::new_from_slice(hmac_key).map_err(|e| e.to_string())?;
    mac.update(ciphertext);
    Ok(mac.finalize().into_bytes().to_vec())
}

fn verify_mac(hmac_key: &[u8; 32], ciphertext: &[u8], expected: &[u8]) -> Result<(), String> {
    let actual = compute_mac(hmac_key, ciphertext)?;
    if actual != expected {
        return Err("settings_tampered".to_string());
    }
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn seal_and_open_round_trip() {
        let enc_key = [7u8; 32];
        let hmac_key = [9u8; 32];
        let sensitive = SensitiveSettings {
            lock_when_idle: true,
            idle_timeout: "15".to_string(),
        };

        let envelope = seal(&sensitive, &enc_key, &hmac_key).unwrap();
        let opened = open(&envelope, &enc_key, &hmac_key).unwrap();

        assert!(opened.lock_when_idle);
        assert_eq!(opened.idle_timeout, "15");
    }

    #[test]
    fn open_rejects_tampered_mac() {
        let enc_key = [7u8; 32];
        let hmac_key = [9u8; 32];
        let sensitive = SensitiveSettings {
            lock_when_idle: false,
            idle_timeout: "5".to_string(),
        };

        let mut envelope = seal(&sensitive, &enc_key, &hmac_key).unwrap();
        envelope.mac = BASE64.encode([0u8; 32]);

        assert!(open(&envelope, &enc_key, &hmac_key).is_err());
    }
}
