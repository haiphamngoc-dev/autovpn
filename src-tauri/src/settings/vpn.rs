use std::collections::BTreeMap;

use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct VpnProfileConfig {
    #[serde(default)]
    pub use_totp: bool,
    #[serde(default)]
    pub has_credentials: bool,
}

fn default_auto_reconnect_max_attempts() -> u32 {
    3
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AutoReconnectSettings {
    #[serde(default)]
    pub enabled: bool,
    #[serde(default = "default_auto_reconnect_max_attempts")]
    pub max_attempts: u32,
}

impl Default for AutoReconnectSettings {
    fn default() -> Self {
        Self {
            enabled: false,
            max_attempts: default_auto_reconnect_max_attempts(),
        }
    }
}

impl AutoReconnectSettings {
    pub fn sanitize(mut self) -> Self {
        self.max_attempts = self.max_attempts.clamp(1, 10);
        self
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct VpnSettings {
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub default_profile: Option<String>,
    #[serde(default, skip_serializing_if = "BTreeMap::is_empty")]
    pub profile_configs: BTreeMap<String, VpnProfileConfig>,
    #[serde(default)]
    pub auto_connect: bool,
    #[serde(default)]
    pub auto_reconnect: AutoReconnectSettings,
}

impl VpnSettings {
    pub fn sanitize(mut self) -> Self {
        self.default_profile = self
            .default_profile
            .map(|name| name.trim().to_string())
            .filter(|name| !name.is_empty());

        let mut sanitized_configs = BTreeMap::new();

        for (name, config) in self.profile_configs {
            let trimmed_name = name.trim();

            if trimmed_name.is_empty() {
                continue;
            }

            sanitized_configs.insert(trimmed_name.to_string(), config.sanitize());
        }

        self.profile_configs = sanitized_configs;
        self.auto_reconnect = self.auto_reconnect.sanitize();
        self
    }

    pub fn profile_config(&self, profile_name: &str) -> Option<&VpnProfileConfig> {
        self.profile_configs.get(profile_name)
    }

    pub fn profile_config_mut(&mut self, profile_name: &str) -> &mut VpnProfileConfig {
        self.profile_configs
            .entry(profile_name.to_string())
            .or_default()
    }
}

impl VpnProfileConfig {
    pub fn sanitize(self) -> Self {
        self
    }
}
