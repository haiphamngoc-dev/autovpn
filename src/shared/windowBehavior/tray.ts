import { invoke } from "@tauri-apps/api/core";

type TrayLabels = {
  show: string;
  quit: string;
  connect: string;
  disconnect: string;
};

export async function syncTrayIcon(
  closeToTray: boolean,
  labels: TrayLabels
): Promise<void> {
  await invoke("sync_tray_icon", {
    closeToTray,
    showLabel: labels.show,
    quitLabel: labels.quit,
    connectLabel: labels.connect,
    disconnectLabel: labels.disconnect,
  });
}

export async function destroyTrayIcon(): Promise<void> {
  await invoke("sync_tray_icon", {
    closeToTray: false,
    showLabel: "",
    quitLabel: "",
    connectLabel: "",
    disconnectLabel: "",
  });
}
