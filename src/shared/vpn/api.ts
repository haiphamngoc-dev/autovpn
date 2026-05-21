import { invoke } from "@tauri-apps/api/core";
import type { VpnConnectionStatus } from "./types";

export async function fetchVpnStatus(): Promise<VpnConnectionStatus> {
  return invoke<VpnConnectionStatus>("get_vpn_status");
}

export async function connectVpn(): Promise<void> {
  await invoke("connect_vpn");
}

export async function disconnectVpn(): Promise<void> {
  await invoke("disconnect_vpn");
}
