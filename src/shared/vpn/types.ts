export type VpnConnectionStatus = "disconnected" | "connecting" | "connected";

export type VpnProfile = {
  name: string;
  status: VpnConnectionStatus;
};
