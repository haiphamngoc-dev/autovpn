mod keyring_store;
mod settings;

use keyring_store::{
    has_app_lock_pin, remove_app_lock_pin, set_app_lock_pin, verify_app_lock_pin,
};
use settings::{
    get_app_lock_settings, get_appearance_settings, save_app_lock_settings,
    save_appearance_settings,
};

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    if let Err(error) = keyring_store::init() {
        eprintln!("Failed to initialize keyring store: {error}");
    }

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            greet,
            get_appearance_settings,
            save_appearance_settings,
            get_app_lock_settings,
            save_app_lock_settings,
            has_app_lock_pin,
            set_app_lock_pin,
            verify_app_lock_pin,
            remove_app_lock_pin,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
