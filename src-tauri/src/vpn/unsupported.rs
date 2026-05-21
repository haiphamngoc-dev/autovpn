use super::types::VpnConnectionStatus;

pub fn get_system_vpn_status() -> Result<VpnConnectionStatus, String> {
    Err("vpn_unsupported_platform".to_string())
}

pub fn connect_system_vpn() -> Result<(), String> {
    Err("vpn_unsupported_platform".to_string())
}

pub fn disconnect_system_vpn() -> Result<(), String> {
    Err("vpn_unsupported_platform".to_string())
}
