use crate::settings::load_settings;

pub fn resolve_default_profile() -> Result<String, String> {
    let settings = load_settings().unwrap_or_default();

    let default_profile = settings
        .vpn
        .default_profile
        .clone()
        .filter(|name| !name.is_empty())
        .ok_or("vpn_profile_not_selected".to_string())?;

    // Check system profiles first
    if let Ok(profiles) = super::list_system_vpn_profiles() {
        if profiles
            .iter()
            .any(|profile| profile.name == default_profile)
        {
            return Ok(default_profile);
        }
    }

    // Also accept app-imported profiles (stored in settings.json)
    if settings.vpn.profile_configs.contains_key(&default_profile) {
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
