import { invoke } from "@tauri-apps/api/core";
import type { VpnConnectionStatus, VpnProfile, VpnLogEntry } from "./types";
import { invalidateVpnSettingsCache } from "../settings/vpn";

/** Emitted from Rust on Linux when NetworkManager signals a change. */
export const VPN_STATUS_CHANGED_EVENT = "vpn-status-changed";

export async function fetchVpnStatus(): Promise<VpnConnectionStatus> {
  return invoke<VpnConnectionStatus>("get_vpn_status");
}

export async function connectVpn(): Promise<void> {
  await invoke("connect_vpn");
}

export async function disconnectVpn(): Promise<void> {
  await invoke("disconnect_vpn");
}

export async function reconnectVpn(): Promise<void> {
  await invoke("reconnect_vpn");
}

export async function fetchVpnProfiles(): Promise<VpnProfile[]> {
  return invoke<VpnProfile[]>("get_vpn_profiles");
}

export async function fetchVpnLogs(): Promise<VpnLogEntry[]> {
  return invoke<VpnLogEntry[]>("get_vpn_logs");
}

export async function importVpnProfile(
  profileName: string,
  vpnType: string,
  configContent: string,
  username: string
): Promise<void> {
  await invoke("import_vpn_profile", {
    profileName,
    vpnType,
    configContent,
    username,
  });
  invalidateVpnSettingsCache();
}

export async function deleteVpnProfile(profileName: string): Promise<void> {
  await invoke("delete_vpn_profile", { profileName });
  invalidateVpnSettingsCache();
}
