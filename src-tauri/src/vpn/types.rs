use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum VpnConnectionStatus {
    Disconnected,
    Connecting,
    Connected,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct VpnProfile {
    pub name: String,
    pub status: VpnConnectionStatus,
}

impl VpnConnectionStatus {
    pub fn from_nm_state(state: &str) -> Option<Self> {
        match state {
            "activated" => Some(Self::Connected),
            "activating" => Some(Self::Connecting),
            "deactivating" => Some(Self::Connecting),
            "deactivated" | "disabled" => Some(Self::Disconnected),
            _ => None,
        }
    }
}
