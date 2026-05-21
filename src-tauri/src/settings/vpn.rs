use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct VpnSettings {
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub default_profile: Option<String>,
}

impl VpnSettings {
    pub fn sanitize(mut self) -> Self {
        self.default_profile = self
            .default_profile
            .map(|name| name.trim().to_string())
            .filter(|name| !name.is_empty());

        self
    }
}
