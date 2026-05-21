import { useContext } from "react";
import { VpnStatusContext } from "./VpnStatusContext";

export function useVpnStatus() {
  const value = useContext(VpnStatusContext);

  if (!value) {
    throw new Error("useVpnStatus must be used within VpnStatusProvider");
  }

  return value;
}
