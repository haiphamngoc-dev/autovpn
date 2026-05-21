import { createContext } from "react";
import type { VpnConnectionStatus } from "./types";

export type VpnStatusContextValue = {
  status: VpnConnectionStatus;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  isBusy: boolean;
};

export const VpnStatusContext = createContext<VpnStatusContextValue | null>(
  null
);
