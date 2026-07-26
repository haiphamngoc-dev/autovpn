use super::types::VpnLogEntry;
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::{Mutex, OnceLock};
use tauri::{AppHandle, Emitter};

#[allow(dead_code)]
static INTENDED_ACTIVE: AtomicBool = AtomicBool::new(false);

#[allow(dead_code)]
pub fn set_intended_active(active: bool) {
    INTENDED_ACTIVE.store(active, Ordering::Relaxed);
}

#[allow(dead_code)]
pub fn intended_active() -> bool {
    INTENDED_ACTIVE.load(Ordering::Relaxed)
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
