use std::collections::BTreeMap;

use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct VpnProfileConfig {
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub username: Option<String>,
    #[serde(default)]
    pub use_totp: bool,
    #[serde(default)]
    pub has_credentials: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct VpnSettings {
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub default_profile: Option<String>,
    #[serde(default, skip_serializing_if = "BTreeMap::is_empty")]
    pub profile_configs: BTreeMap<String, VpnProfileConfig>,
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
    pub fn sanitize(mut self) -> Self {
        self.username = self
            .username
            .map(|value| value.trim().to_string())
            .filter(|value| !value.is_empty());

        self
    }
}
