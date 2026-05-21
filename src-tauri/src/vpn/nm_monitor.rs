use std::time::Duration;

use futures_util::StreamExt;
use tauri::{AppHandle, Emitter};
use tokio::sync::mpsc;
use tokio::time::sleep;
use zbus::{message::Type, Connection, MatchRule, MessageStream};

use super::{get_system_vpn_status, types::VpnConnectionStatus};

pub const VPN_STATUS_CHANGED_EVENT: &str = "vpn-status-changed";

const DEBOUNCE_MS: u64 = 150;

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

    tauri::async_runtime::spawn(async move {
        while let Some(message) = stream.next().await {
            if message.is_err() {
                break;
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

    if let Err(error) = app.emit(VPN_STATUS_CHANGED_EVENT, status) {
        eprintln!("Failed to emit VPN status event: {error}");
    }
}
