use crate::vpn::credentials::VpnConnectAuth;
use crate::vpn::types::{VpnConnectionStatus, VpnProfile};

pub trait VpnDriver: Send + Sync {
    fn connect(&self, profile_name: &str, auth: Option<&VpnConnectAuth>) -> Result<(), String>;
    fn disconnect(&self, profile_name: Option<&str>) -> Result<(), String>;
    fn get_status(&self) -> Result<VpnConnectionStatus, String>;
    fn list_profiles(&self) -> Result<Vec<VpnProfile>, String>;
    fn get_profile_username(&self, profile_name: &str) -> Result<String, String>;
    fn start_status_monitor(&self, _app: tauri::AppHandle) {}
}
