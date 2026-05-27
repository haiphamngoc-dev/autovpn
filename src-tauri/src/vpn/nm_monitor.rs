use std::time::Duration;

use futures_util::StreamExt;
use tauri::{AppHandle, Emitter};
use tokio::sync::mpsc;
use tokio::time::sleep;
use zbus::{message::Type, Connection, MatchRule, MessageStream};

use super::{get_system_vpn_status, types::VpnConnectionStatus};

pub const VPN_STATUS_CHANGED_EVENT: &str = "vpn-status-changed";

const DEBOUNCE_MS: u64 = 150;

use super::types::VpnLogEntry;

use std::sync::{Mutex, OnceLock};
use std::sync::atomic::{AtomicBool, AtomicU32, Ordering};

static INTENDED_ACTIVE: AtomicBool = AtomicBool::new(false);
static RECONNECT_ATTEMPTS: AtomicU32 = AtomicU32::new(0);

pub fn set_intended_active(active: bool) {
    INTENDED_ACTIVE.store(active, Ordering::Relaxed);
    if active {
        RECONNECT_ATTEMPTS.store(0, Ordering::Relaxed);
    }
}

pub fn intended_active() -> bool {
    INTENDED_ACTIVE.load(Ordering::Relaxed)
}

pub fn reset_reconnect_attempts() {
    RECONNECT_ATTEMPTS.store(0, Ordering::Relaxed);
}

fn log_buffer() -> &'static Mutex<Vec<VpnLogEntry>> {
    static BUFFER: OnceLock<Mutex<Vec<VpnLogEntry>>> = OnceLock::new();
    BUFFER.get_or_init(|| Mutex::new(Vec::new()))
}

pub fn get_buffered_logs() -> Vec<VpnLogEntry> {
    if let Ok(buffer) = log_buffer().lock() {
        buffer.clone()
    } else {
        Vec::new()
    }
}

pub fn emit_vpn_log(app: &AppHandle, level: &str, source: &str, message: &str) {
    let timestamp = chrono::Local::now().format("%H:%M:%S").to_string();
    let entry = VpnLogEntry {
        timestamp,
        level: level.to_string(),
        source: source.to_string(),
        message: message.to_string(),
    };
    
    if let Ok(mut buffer) = log_buffer().lock() {
        buffer.push(entry.clone());
        if buffer.len() > 500 {
            buffer.remove(0);
        }
    }
    
    let _ = app.emit("vpn-log", entry);
}

async fn try_auto_reconnect(app: &AppHandle) {
    let settings = match crate::settings::load_settings() {
        Ok(s) => s.vpn,
        Err(_) => return,
    };

    if !settings.auto_reconnect.enabled {
        return;
    }

    if !intended_active() {
        return;
    }

    if let Ok(status) = get_system_vpn_status() {
        if status == VpnConnectionStatus::Connected || status == VpnConnectionStatus::Connecting {
            return;
        }
    }

    let attempts = RECONNECT_ATTEMPTS.load(Ordering::Relaxed);
    let max_attempts = settings.auto_reconnect.max_attempts;

    if attempts >= max_attempts {
        emit_vpn_log(
            app,
            "warning",
            "AutoVPN",
            &format!("Reached maximum auto-reconnect attempts ({}/{}). Stopping auto-reconnect.", attempts, max_attempts)
        );
        return;
    }

    let next_attempt = attempts + 1;
    RECONNECT_ATTEMPTS.store(next_attempt, Ordering::Relaxed);

    emit_vpn_log(
        app,
        "info",
        "AutoVPN",
        &format!("Auto-reconnect triggered (Attempt {}/{})...", next_attempt, max_attempts)
    );

    let app_clone = app.clone();
    tauri::async_runtime::spawn(async move {
        sleep(Duration::from_secs(3)).await;

        if !intended_active() {
            return;
        }

        match tauri::async_runtime::spawn_blocking(super::connect_system_vpn).await {
            Ok(Ok(())) => {
                emit_vpn_log(&app_clone, "success", "AutoVPN", "Auto-reconnect successful.");
            }
            Ok(Err(err)) => {
                emit_vpn_log(&app_clone, "error", "AutoVPN", &format!("Auto-reconnect attempt failed: {}", err));
            }
            Err(err) => {
                emit_vpn_log(&app_clone, "error", "AutoVPN", &format!("Auto-reconnect task failed: {}", err));
            }
        }
    });
}

pub fn start(app: AppHandle) {
    tauri::async_runtime::spawn(async move {
        if let Err(error) = run(app).await {
            eprintln!("NetworkManager VPN monitor exited: {error}");
        }
    });
}

async fn run(app: AppHandle) -> Result<(), String> {
    let connection = Connection::system()
        .await
        .map_err(|error| format!("dbus_connect:{error}"))?;

    let rule = MatchRule::builder()
        .msg_type(Type::Signal)
        .sender("org.freedesktop.NetworkManager")
        .map_err(|error| format!("dbus_match_rule:{error}"))?
        .build();

    let mut stream = MessageStream::for_match_rule(rule, &connection, None)
        .await
        .map_err(|error| format!("dbus_subscribe:{error}"))?;

    let (signal_tx, mut signal_rx) = mpsc::unbounded_channel();

    let app_for_stream = app.clone();
    tauri::async_runtime::spawn(async move {
        emit_vpn_log(&app_for_stream, "info", "AutoVPN", "Real-time NetworkManager monitor active.");

        while let Some(msg_res) = stream.next().await {
            let Ok(message) = msg_res else {
                break;
            };

            let header = message.header();
            let interface = header.interface().map(|i| i.to_string()).unwrap_or_default();
            let member = header.member().map(|m| m.to_string()).unwrap_or_default();

            let log_msg = match (interface.as_str(), member.as_str()) {
                ("org.freedesktop.NetworkManager", "StateChanged") => {
                    if let Ok(state) = message.body().deserialize::<u32>() {
                        let state_str = match state {
                            0 => "UNKNOWN",
                            10 => "ASLEEP",
                            20 => "DISCONNECTED",
                            30 => "DISCONNECTING",
                            40 => "CONNECTING",
                            50 => "CONNECTED_LOCAL",
                            60 => "CONNECTED_SITE",
                            70 => "CONNECTED_GLOBAL",
                            _ => "UNKNOWN",
                        };
                        
                        if state == 70 {
                            let app_clone = app_for_stream.clone();
                            tauri::async_runtime::spawn(async move {
                                sleep(Duration::from_millis(500)).await;
                                try_auto_reconnect(&app_clone).await;
                            });
                        }
                        
                        Some(format!("Global network state: {} (State: {})", state_str, state))
                    } else {
                        Some("Global network state changed".to_string())
                    }
                }
                ("org.freedesktop.NetworkManager.Connection.Active", "StateChanged") => {
                    if let Ok((state, reason)) = message.body().deserialize::<(u32, u32)>() {
                        let state_str = match state {
                            0 => "UNKNOWN",
                            1 => "ACTIVATING",
                            2 => "ACTIVATED",
                            3 => "DEACTIVATING",
                            4 => "DEACTIVATED",
                            _ => "UNKNOWN",
                        };
                        Some(format!("Active connection: {} (State: {}, Reason: {})", state_str, state, reason))
                    } else {
                        Some("Active connection state changed".to_string())
                    }
                }
                ("org.freedesktop.NetworkManager.VPN.Connection", "VpnStateChanged") => {
                    if let Ok((state, reason)) = message.body().deserialize::<(u32, u32)>() {
                        let state_str = match state {
                            0 => "UNKNOWN",
                            1 => "PREPARE",
                            2 => "NEED_AUTH",
                            3 => "CONNECT",
                            4 => "GET_CONFIG",
                            5 => "ACTIVATED",
                            6 => "FAILED",
                            7 => "DISCONNECTED",
                            _ => "UNKNOWN",
                        };
                        let level = if state == 6 { "error" } else if state == 5 { "success" } else { "info" };
                        emit_vpn_log(&app_for_stream, level, "NetworkManager", &format!("VPN connection: {} (State: {}, Reason: {})", state_str, state, reason));
                        
                        if state == 5 {
                            reset_reconnect_attempts();
                        } else if state == 6 || state == 7 {
                            if reason == 2 {
                                // Explicit user disconnection (NetworkManager, tray, or app)
                                set_intended_active(false);
                            } else {
                                let app_clone = app_for_stream.clone();
                                tauri::async_runtime::spawn(async move {
                                    sleep(Duration::from_secs(2)).await;
                                    try_auto_reconnect(&app_clone).await;
                                });
                            }
                        }
                        None
                    } else {
                        Some("VPN connection state changed".to_string())
                    }
                }
                _ => None,
            };

            if let Some(msg) = log_msg {
                let level = if msg.contains("FAILED") || msg.contains("UNKNOWN") {
                    "error"
                } else if msg.contains("ACTIVATED") || msg.contains("CONNECTED_GLOBAL") {
                    "success"
                } else {
                    "info"
                };
                emit_vpn_log(&app_for_stream, level, "NetworkManager", &msg);
            }

            let _ = signal_tx.send(());
        }
    });

    let mut last_emitted: Option<VpnConnectionStatus> = None;
    publish_status(&app, &mut last_emitted).await;

    while signal_rx.recv().await.is_some() {
        sleep(Duration::from_millis(DEBOUNCE_MS)).await;

        while signal_rx.try_recv().is_ok() {}

        publish_status(&app, &mut last_emitted).await;
    }

    Ok(())
}

async fn publish_status(app: &AppHandle, last_emitted: &mut Option<VpnConnectionStatus>) {
    let status = match tauri::async_runtime::spawn_blocking(get_system_vpn_status).await {
        Ok(Ok(status)) => status,
        _ => return,
    };

    if *last_emitted == Some(status) {
        return;
    }

    *last_emitted = Some(status);

    let _ = crate::tray::refresh_tray_menu(app);

    if let Err(error) = app.emit(VPN_STATUS_CHANGED_EVENT, status) {
        eprintln!("Failed to emit VPN status event: {error}");
    }
}
