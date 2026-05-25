export type VpnConnectionStatus = "disconnected" | "connecting" | "connected";

export type VpnProfile = {
  name: string;
  status: VpnConnectionStatus;
};

export type VpnLogEntry = {
  timestamp: string;
  level: "info" | "success" | "error";
  source: string;
  message: string;
};
