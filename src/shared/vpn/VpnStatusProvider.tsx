import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { connectVpn, disconnectVpn, fetchVpnStatus } from "./api";
import { VpnStatusContext } from "./VpnStatusContext";
import type { VpnConnectionStatus } from "./types";

const STATUS_POLL_INTERVAL_MS = 2_000;

type VpnStatusProviderProps = {
  children: ReactNode;
};

export function VpnStatusProvider({
  children,
}: Readonly<VpnStatusProviderProps>) {
  const [status, setStatus] = useState<VpnConnectionStatus>("disconnected");
  const [isBusy, setIsBusy] = useState(false);

  const refreshStatus = useCallback(async () => {
    try {
      const next = await fetchVpnStatus();
      setStatus(next);
    } catch {
      setStatus("disconnected");
    }
  }, []);

  useEffect(() => {
    void refreshStatus();

    const intervalId = globalThis.setInterval(() => {
      void refreshStatus();
    }, STATUS_POLL_INTERVAL_MS);

    return () => {
      globalThis.clearInterval(intervalId);
    };
  }, [refreshStatus]);

  const connect = useCallback(async () => {
    if (status === "connected" || isBusy) {
      return;
    }

    setIsBusy(true);
    setStatus("connecting");

    try {
      await connectVpn();
      await refreshStatus();
    } catch {
      await refreshStatus();
    } finally {
      setIsBusy(false);
    }
  }, [isBusy, refreshStatus, status]);

  const disconnect = useCallback(async () => {
    if (status === "disconnected" || isBusy) {
      return;
    }

    setIsBusy(true);
    setStatus("connecting");

    try {
      await disconnectVpn();
      await refreshStatus();
    } catch {
      await refreshStatus();
    } finally {
      setIsBusy(false);
    }
  }, [isBusy, refreshStatus, status]);

  const value = useMemo(
    () => ({
      status,
      connect,
      disconnect,
      isBusy,
      refreshStatus,
    }),
    [connect, disconnect, isBusy, refreshStatus, status]
  );

  return (
    <VpnStatusContext.Provider value={value}>
      {children}
    </VpnStatusContext.Provider>
  );
}
