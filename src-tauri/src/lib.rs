mod keyring_store;
mod settings;
mod single_instance;
mod system_integration;
mod tray;
mod vpn;
mod window_behavior;

use keyring_store::{
    has_app_lock_pin, init_app_lock_secrets, remove_app_lock_pin, remove_app_lock_secrets_command,
    set_app_lock_pin, verify_app_lock_pin,
};
use settings::{
    get_app_lock_settings, get_appearance_settings, get_system_integration_settings,
    get_vpn_settings, get_window_behavior_settings, load_settings, save_app_lock_settings,
    save_appearance_settings, save_system_integration_settings, save_vpn_settings,
    save_window_behavior_settings,
};
use tauri::WindowEvent;
use tray::TrayLabels;
use vpn::{
    connect_system_vpn, connect_vpn, disconnect_vpn, reconnect_vpn, get_vpn_profile_credentials, get_vpn_profiles,
    get_vpn_status, get_vpn_logs, remove_vpn_profile_credentials, save_vpn_profile_credentials,
    start_vpn_status_monitor, get_system_vpn_profile_username,
};

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
fn sync_tray_icon(
    app: tauri::AppHandle,
    close_to_tray: bool,
    show_label: String,
    quit_label: String,
    connect_label: String,
    disconnect_label: String,
    reconnect_label: String,
) -> Result<(), String> {
    tray::sync_tray(
        &app,
        close_to_tray,
        &TrayLabels {
            show: show_label,
            quit: quit_label,
            connect: connect_label,
            disconnect: disconnect_label,
            reconnect: reconnect_label,
        },
    )
}

#[tauri::command]
async fn download_deb_package(url: String, filename: String) -> Result<String, String> {
    let file_path = tauri::async_runtime::spawn_blocking(move || {
        rfd::FileDialog::new()
            .set_file_name(&filename)
            .add_filter("Debian Package", &["deb"])
            .save_file()
    }).await.map_err(|e| e.to_string())?;

    let file_path = match file_path {
        Some(path) => path,
        None => return Ok("cancelled".to_string()),
    };

    let url_clone = url.clone();
    let file_path_clone = file_path.clone();
    tauri::async_runtime::spawn_blocking(move || {
        let resp = ureq::get(&url_clone)
            .call()
            .map_err(|e| format!("Failed to connect: {}", e))?;
            
        let mut reader = resp.into_reader();
        let mut file = std::fs::File::create(&file_path_clone)
            .map_err(|e| format!("Failed to create file: {}", e))?;
            
        std::io::copy(&mut reader, &mut file)
            .map_err(|e| format!("Failed to write file: {}", e))?;
            
        Ok::<(), String>(())
    }).await.map_err(|e| e.to_string())??;

    Ok(file_path.to_string_lossy().to_string())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    if let Err(error) = keyring_store::init() {
        eprintln!("Failed to initialize keyring store: {error}. App lock PIN will not persist.");
    }

    let mut builder = tauri::Builder::default();

    #[cfg(any(target_os = "linux", target_os = "macos", target_os = "windows"))]
    {
        builder = builder.plugin(tauri_plugin_single_instance::init(|app, _args, _cwd| {
            single_instance::focus_running_instance(app)
        }));
    }

    builder
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_autostart::init(
            tauri_plugin_autostart::MacosLauncher::LaunchAgent,
            None,
        ))
        .plugin(tauri_plugin_updater::Builder::new().build())
        .setup(|app| {
            let settings = load_settings().unwrap_or_default();
            window_behavior::apply(app.handle(), &settings.window_behavior)?;
            system_integration::apply(app.handle(), &settings.system_integration)?;
            system_integration::apply_launch_minimized(app.handle(), &settings.system_integration);
            
            #[cfg(target_os = "linux")]
            if settings.vpn.auto_connect {
                vpn::nm_monitor::set_intended_active(true);
            }
            
            start_vpn_status_monitor(app.handle().clone());

            if settings.vpn.auto_connect {
                tauri::async_runtime::spawn(async {
                    let result = tauri::async_runtime::spawn_blocking(connect_system_vpn).await;
                    match result {
                        Ok(Ok(())) => {}
                        Ok(Err(error)) => eprintln!("Auto-connect failed: {error}"),
                        Err(error) => eprintln!("Auto-connect task failed: {error}"),
                    }
                });
            }

            Ok(())
        })
        .on_window_event(|window, event| {
            if let WindowEvent::CloseRequested { api, .. } = event {
                let close_to_tray = load_settings()
                    .map(|settings| settings.window_behavior.close_to_tray)
                    .unwrap_or(false);

                if close_to_tray {
                    let _ = window.hide();
                    api.prevent_close();
                }
            }
        })
        .invoke_handler(tauri::generate_handler![
            greet,
            get_appearance_settings,
            save_appearance_settings,
            get_app_lock_settings,
            save_app_lock_settings,
            get_window_behavior_settings,
            save_window_behavior_settings,
            get_system_integration_settings,
            save_system_integration_settings,
            sync_tray_icon,
            has_app_lock_pin,
            set_app_lock_pin,
            verify_app_lock_pin,
            remove_app_lock_pin,
            init_app_lock_secrets,
            remove_app_lock_secrets_command,
            get_vpn_settings,
            save_vpn_settings,
            get_vpn_status,
            get_vpn_profiles,
            get_vpn_logs,
            connect_vpn,
            disconnect_vpn,
            reconnect_vpn,
            get_vpn_profile_credentials,
            save_vpn_profile_credentials,
            remove_vpn_profile_credentials,
            get_system_vpn_profile_username,
            download_deb_package,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
