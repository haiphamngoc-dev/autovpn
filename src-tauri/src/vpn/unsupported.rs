use super::types::{VpnConnectionStatus, VpnProfile};

pub fn get_system_vpn_status() -> Result<VpnConnectionStatus, String> {
    Err("vpn_unsupported_platform".to_string())
}

pub fn connect_system_vpn(
    _profile_name: &str,
    _auth: Option<&super::credentials::VpnConnectAuth>,
) -> Result<(), String> {
    Err("vpn_unsupported_platform".to_string())
}

pub fn disconnect_system_vpn(_profile_name: Option<&str>) -> Result<(), String> {
    Err("vpn_unsupported_platform".to_string())
}

pub fn list_system_vpn_profiles() -> Result<Vec<VpnProfile>, String> {
    Ok(Vec::new())
}

pub fn get_system_vpn_profile_username(_profile_name: &str) -> Result<String, String> {
    Ok(String::new())
}
