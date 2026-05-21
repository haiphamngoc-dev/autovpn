import { useCallback, useMemo, useState, type ReactNode } from "react";
import { VpnStatusContext } from "./VpnStatusContext";
import type { VpnConnectionStatus } from "./types";

const TRANSITION_DELAY_MS = 600;

type VpnStatusProviderProps = {
  children: ReactNode;
};

function delay(ms: number) {
  return new Promise<void>((resolve) => {
    globalThis.setTimeout(resolve, ms);
  });
}

export function VpnStatusProvider({
  children,
}: Readonly<VpnStatusProviderProps>) {
  const [status, setStatus] = useState<VpnConnectionStatus>("disconnected");
  const [isBusy, setIsBusy] = useState(false);

  const connect = useCallback(async () => {
    if (status === "connected" || isBusy) {
      return;
    }

    setIsBusy(true);
    setStatus("connecting");

    try {
      // TODO: invoke Tauri VPN connect command when backend is available.
      await delay(TRANSITION_DELAY_MS);
      setStatus("connected");
    } catch {
      setStatus("disconnected");
    } finally {
      setIsBusy(false);
    }
  }, [isBusy, status]);

  const disconnect = useCallback(async () => {
    if (status === "disconnected" || isBusy) {
      return;
    }

    setIsBusy(true);
    setStatus("connecting");

    try {
      // TODO: invoke Tauri VPN disconnect command when backend is available.
      await delay(TRANSITION_DELAY_MS);
      setStatus("disconnected");
    } catch {
      setStatus("connected");
    } finally {
      setIsBusy(false);
    }
  }, [isBusy, status]);

  const value = useMemo(
    () => ({
      status,
      connect,
      disconnect,
      isBusy,
    }),
    [connect, disconnect, isBusy, status]
  );

  return (
    <VpnStatusContext.Provider value={value}>
      {children}
    </VpnStatusContext.Provider>
  );
}
