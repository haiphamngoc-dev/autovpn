import { isLinux } from "@shared/lib/platform";
import { listen } from "@tauri-apps/api/event";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  connectVpn,
  disconnectVpn,
  fetchVpnStatus,
  VPN_STATUS_CHANGED_EVENT,
} from "./api";
import { VpnStatusContext } from "./VpnStatusContext";
import type { VpnConnectionStatus } from "./types";

/** Linux uses NM D-Bus events; other platforms poll more often. */
const STATUS_POLL_INTERVAL_MS = isLinux ? 30_000 : 2_000;

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
    let cancelled = false;

    async function pollStatus() {
      try {
        const next = await fetchVpnStatus();

        if (!cancelled) {
          setStatus(next);
        }
      } catch {
        if (!cancelled) {
          setStatus("disconnected");
        }
      }
    }

    void pollStatus();

    const intervalId = globalThis.setInterval(() => {
      void pollStatus();
    }, STATUS_POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      globalThis.clearInterval(intervalId);
    };
  }, []);

  useEffect(() => {
    if (!isLinux) {
      return;
    }

    let unlisten: (() => void) | undefined;

    void listen<VpnConnectionStatus>(VPN_STATUS_CHANGED_EVENT, (event) => {
      setStatus(event.payload);
    }).then((fn) => {
      unlisten = fn;
    });

    return () => {
      unlisten?.();
    };
  }, []);

  const connect = useCallback(async () => {
    if (status === "connected" || isBusy || status === "connecting") {
      return;
    }

    setIsBusy(true);

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
