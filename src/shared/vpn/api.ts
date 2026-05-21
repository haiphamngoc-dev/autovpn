import { invoke } from "@tauri-apps/api/core";
import type { VpnConnectionStatus, VpnProfile } from "./types";

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

export async function fetchVpnProfiles(): Promise<VpnProfile[]> {
  return invoke<VpnProfile[]>("get_vpn_profiles");
}
