use std::sync::Mutex;

use tauri::{
    image::Image,
    menu::{Menu, MenuItem},
    tray::{MouseButton, TrayIcon, TrayIconBuilder, TrayIconEvent},
    AppHandle, Manager, Runtime,
};

#[cfg(not(target_os = "linux"))]
const TRAY_TOOLTIP: &str = "autovpn";

/// On Linux (KDE/Ayatana), `title` is drawn next to the icon in the panel — keep it empty.
/// Use `tooltip` on platforms where it is supported.
fn clear_tray_title<R: Runtime>(tray: &TrayIcon<R>) -> Result<(), String> {
    #[cfg(target_os = "linux")]
    {
        tray.set_title(Some(""))
            .map_err(|error| error.to_string())?;
    }

    Ok(())
}

pub const TRAY_ID: &str = "autovpn-tray";

static TRAY_SYNC: Mutex<()> = Mutex::new(());
static TRAY_LABELS: Mutex<Option<TrayLabels>> = Mutex::new(None);

#[derive(Clone)]
pub struct TrayLabels {
    pub show: String,
    pub quit: String,
    pub connect: String,
    pub disconnect: String,
    pub reconnect: String,
}

fn tray_icon<'a, R: Runtime>(app: &'a AppHandle<R>) -> Result<Image<'a>, String> {
    if let Some(icon) = app.default_window_icon().cloned() {
        return Ok(icon);
    }

    let icon_path = app
        .path()
        .resource_dir()
        .map_err(|error| error.to_string())?
        .join("icons/32x32.png");

    Image::from_path(&icon_path).map_err(|error| error.to_string())
}

fn build_tray_menu<R: Runtime>(app: &AppHandle<R>, labels: &TrayLabels) -> Result<Menu<R>, String> {
    let show_item = MenuItem::with_id(app, "tray_show", &labels.show, true, None::<&str>)
        .map_err(|error| error.to_string())?;
    let quit_item = MenuItem::with_id(app, "tray_quit", &labels.quit, true, None::<&str>)
        .map_err(|error| error.to_string())?;

    let settings = crate::settings::load_settings().unwrap_or_default();
    let mut menu_items: Vec<&dyn tauri::menu::IsMenuItem<R>> = vec![&show_item];

    let conn_item; // Keep it in scope
    let reconn_item; // Keep it in scope
    if let Some(ref default_profile) = settings.vpn.default_profile {
        if !default_profile.is_empty() {
            let status = crate::vpn::get_system_vpn_status().unwrap_or(crate::vpn::VpnConnectionStatus::Disconnected);
            let label = if status == crate::vpn::VpnConnectionStatus::Disconnected {
                format!("{}: {}", labels.connect, default_profile)
            } else {
                format!("{}: {}", labels.disconnect, default_profile)
            };
            conn_item = MenuItem::with_id(app, "tray_connect_disconnect", &label, true, None::<&str>)
                .map_err(|error| error.to_string())?;
            menu_items.push(&conn_item);

            if status != crate::vpn::VpnConnectionStatus::Disconnected {
                let reconn_label = labels.reconnect.clone();
                reconn_item = MenuItem::with_id(app, "tray_reconnect", &reconn_label, true, None::<&str>)
                    .map_err(|error| error.to_string())?;
                menu_items.push(&reconn_item);
            }
        }
    }

    menu_items.push(&quit_item);

    Menu::with_items(app, &menu_items).map_err(|error| error.to_string())
}

pub fn sync_tray<R: Runtime>(
    app: &AppHandle<R>,
    enabled: bool,
    labels: &TrayLabels,
) -> Result<(), String> {
    let _guard = TRAY_SYNC
        .lock()
        .map_err(|error| format!("tray sync lock poisoned: {error}"))?;

    {
        if let Ok(mut guard) = TRAY_LABELS.lock() {
            *guard = Some(labels.clone());
        }
    }

    if !enabled {
        if let Some(tray) = app.tray_by_id(TRAY_ID) {
            // Hide instead of remove: on Linux, remove_tray_by_id can leave a stale
            // StatusNotifierItem on D-Bus, causing duplicate registration on re-enable.
            tray.set_visible(false).map_err(|error| error.to_string())?;
        }
        return Ok(());
    }

    let menu = build_tray_menu(app, labels)?;

    if let Some(tray) = app.tray_by_id(TRAY_ID) {
        tray.set_menu(Some(menu))
            .map_err(|error| error.to_string())?;
        clear_tray_title(&tray)?;
        tray.set_visible(true).map_err(|error| error.to_string())?;
        return Ok(());
    }

    let icon = tray_icon(app)?;

    let builder = TrayIconBuilder::with_id(TRAY_ID)
        .icon(icon)
        .menu(&menu)
        .show_menu_on_left_click(false);

    #[cfg(not(target_os = "linux"))]
    let builder = builder.tooltip(TRAY_TOOLTIP);

    builder
        .on_menu_event(|app, event| match event.id.as_ref() {
            "tray_show" => {
                if let Some(window) = app.get_webview_window("main") {
                    let _ = window.show();
                    let _ = window.set_focus();
                }
            }
            "tray_connect_disconnect" => {
                let status = crate::vpn::get_system_vpn_status().unwrap_or(crate::vpn::VpnConnectionStatus::Disconnected);
                let app_clone = app.clone();
                tauri::async_runtime::spawn(async move {
                    if status == crate::vpn::VpnConnectionStatus::Disconnected {
                        #[cfg(target_os = "linux")]
                        crate::vpn::nm_monitor::set_intended_active(true);
                        
                        let _ = tauri::async_runtime::spawn_blocking(crate::vpn::connect_system_vpn).await;
                    } else {
                        #[cfg(target_os = "linux")]
                        crate::vpn::nm_monitor::set_intended_active(false);
                        
                        let _ = tauri::async_runtime::spawn_blocking(crate::vpn::disconnect_system_vpn).await;
                    }
                    let _ = refresh_tray_menu(&app_clone);
                });
            }
            "tray_reconnect" => {
                let app_clone = app.clone();
                tauri::async_runtime::spawn(async move {
                    #[cfg(target_os = "linux")]
                    crate::vpn::nm_monitor::set_intended_active(true);
                    
                    let _ = tauri::async_runtime::spawn_blocking(crate::vpn::reconnect_system_vpn).await;
                    let _ = refresh_tray_menu(&app_clone);
                });
            }
            "tray_quit" => {
                app.exit(0);
            }
            _ => {}
        })
        .on_tray_icon_event(|tray, event| {
            if let TrayIconEvent::DoubleClick {
                button: MouseButton::Left,
                ..
            } = event
            {
                let app = tray.app_handle();
                if let Some(window) = app.get_webview_window("main") {
                    let _ = window.show();
                    let _ = window.set_focus();
                }
            }
        })
        .build(app)
        .map_err(|error| error.to_string())?;

    Ok(())
}

pub fn refresh_tray_menu<R: Runtime>(app: &AppHandle<R>) -> Result<(), String> {
    let labels = {
        let guard = TRAY_LABELS.lock().map_err(|e| e.to_string())?;
        guard.clone()
    };

    if let Some(labels) = labels {
        if app.tray_by_id(TRAY_ID).is_some() {
            sync_tray(app, true, &labels)?;
        }
    }

    Ok(())
}
