use crate::settings::load_settings;

pub fn resolve_default_profile() -> Result<String, String> {
    let default_profile = load_settings()
        .unwrap_or_default()
        .vpn
        .default_profile
        .filter(|name| !name.is_empty())
        .ok_or("vpn_profile_not_selected".to_string())?;

    let profiles = super::list_system_vpn_profiles()?;

    if profiles
        .iter()
        .any(|profile| profile.name == default_profile)
    {
        return Ok(default_profile);
    }

    Err("vpn_profile_not_found".to_string())
}

pub fn resolve_disconnect_profile() -> Option<String> {
    load_settings()
        .ok()
        .and_then(|settings| settings.vpn.default_profile)
        .filter(|name| !name.is_empty())
}
