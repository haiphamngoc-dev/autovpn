use crate::vpn::types::VpnConnectionStatus;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type", content = "payload", rename_all = "camelCase")]
pub enum IpcRequest {
    Connect {
        profile_name: String,
        vpn_type: String, // "openvpn" | "wireguard"
        config_content: String,
        username: Option<String>,
        password: Option<String>,
    },
    Disconnect {
        profile_name: Option<String>,
    },
    GetStatus,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "status", content = "payload", rename_all = "camelCase")]
pub enum IpcResponse {
    Success {
        vpn_status: VpnConnectionStatus,
        message: String,
    },
    Error {
        message: String,
    },
}
