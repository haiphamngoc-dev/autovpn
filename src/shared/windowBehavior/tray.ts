import { invoke } from "@tauri-apps/api/core";

type TrayLabels = {
  show: string;
  quit: string;
};

export async function syncTrayIcon(
  closeToTray: boolean,
  labels: TrayLabels
): Promise<void> {
  await invoke("sync_tray_icon", {
    closeToTray,
    showLabel: labels.show,
    quitLabel: labels.quit,
  });
}

export async function destroyTrayIcon(): Promise<void> {
  await invoke("sync_tray_icon", {
    closeToTray: false,
    showLabel: "",
    quitLabel: "",
  });
}
