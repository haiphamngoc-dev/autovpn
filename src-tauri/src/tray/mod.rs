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

pub struct TrayLabels {
    pub show: String,
    pub quit: String,
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

    Menu::with_items(app, &[&show_item, &quit_item]).map_err(|error| error.to_string())
}

pub fn sync_tray<R: Runtime>(
    app: &AppHandle<R>,
    enabled: bool,
    labels: &TrayLabels,
) -> Result<(), String> {
    let _guard = TRAY_SYNC
        .lock()
        .map_err(|error| format!("tray sync lock poisoned: {error}"))?;

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
