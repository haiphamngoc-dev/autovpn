import {
  getInvokeErrorMessage,
  hasAppLockPin,
  removeAppLockPin,
  saveAppLockSettings,
  setAppLockPin,
  verifyAppLockPin,
  type AppLockSettings,
} from "@shared/settings/appLock";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { normalizePinErrorCode } from "./pinErrors";
import type { SavePinResult } from "./context";
import { AppLockContext } from "./useAppLock";

const ACTIVITY_EVENTS = [
  "mousemove",
  "mousedown",
  "keydown",
  "touchstart",
  "scroll",
] as const;

const IDLE_CHECK_INTERVAL_MS = 1000;

type AppLockProviderProps = {
  initialSettings: AppLockSettings;
  children: ReactNode;
};

async function savePinToKeyring(
  pin: string,
  confirmPin: string
): Promise<SavePinResult> {
  if (pin !== confirmPin) {
    return { ok: false as const, reason: "mismatch" as const };
  }

  try {
    await setAppLockPin(pin);
    return { ok: true as const };
  } catch (error) {
    return {
      ok: false as const,
      reason: "error" as const,
      code: normalizePinErrorCode(getInvokeErrorMessage(error)),
    };
  }
}

export function AppLockProvider({
  initialSettings,
  children,
}: Readonly<AppLockProviderProps>) {
  const [settings, setSettings] = useState(initialSettings);
  const [hasPin, setHasPin] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const lastActivityRef = useRef(Date.now());

  const markActivity = useCallback(() => {
    lastActivityRef.current = Date.now();
  }, []);

  const refreshHasPin = useCallback(async () => {
    const nextHasPin = await hasAppLockPin();
    setHasPin(nextHasPin);
    return nextHasPin;
  }, []);

  useEffect(() => {
    void refreshHasPin();
  }, [refreshHasPin]);

  useEffect(() => {
    if (!settings.enabled || hasPin) {
      return;
    }

    void (async () => {
      const { persisted } = await saveAppLockSettings({ enabled: false });
      setSettings((current) => ({ ...current, enabled: false }));

      if (!persisted) {
        console.error("Failed to persist app lock disabled state");
      }
    })();
  }, [hasPin, settings.enabled]);

  useEffect(() => {
    if (!settings.enabled || !settings.lockWhenIdle || isLocked) {
      return;
    }

    const intervalId = globalThis.setInterval(() => {
      const idleMs = Number.parseInt(settings.idleTimeout, 10) * 60 * 1000;
      const elapsed = Date.now() - lastActivityRef.current;

      if (elapsed >= idleMs) {
        setIsLocked(true);
      }
    }, IDLE_CHECK_INTERVAL_MS);

    for (const eventName of ACTIVITY_EVENTS) {
      document.addEventListener(eventName, markActivity, { passive: true });
    }

    return () => {
      globalThis.clearInterval(intervalId);

      for (const eventName of ACTIVITY_EVENTS) {
        document.removeEventListener(eventName, markActivity);
      }
    };
  }, [
    isLocked,
    markActivity,
    settings.enabled,
    settings.idleTimeout,
    settings.lockWhenIdle,
  ]);

  const updateSettings = useCallback(
    async (partial: Partial<AppLockSettings>) => {
      const { settings: nextSettings, persisted } =
        await saveAppLockSettings(partial);
      setSettings(nextSettings);
      return { persisted };
    },
    []
  );

  const lock = useCallback(() => {
    if (!settings.enabled || !hasPin) {
      return;
    }

    setIsLocked(true);
  }, [hasPin, settings.enabled]);

  const unlock = useCallback(
    async (pin: string) => {
      if (!hasPin) {
        return false;
      }

      const verified = await verifyAppLockPin(pin);

      if (verified) {
        setIsLocked(false);
        markActivity();
      }

      return verified;
    },
    [hasPin, markActivity]
  );

  const enableAppLock = useCallback(
    async (pin: string, confirmPin: string) => {
      const pinResult = await savePinToKeyring(pin, confirmPin);

      if (!pinResult.ok) {
        return pinResult;
      }

      setHasPin(true);
      const { persisted } = await updateSettings({ enabled: true });

      return { ok: true as const, persisted };
    },
    [updateSettings]
  );

  const changePin = useCallback(
    async (currentPin: string, newPin: string, confirmPin: string) => {
      if (newPin !== confirmPin) {
        return { ok: false as const, reason: "mismatch" as const };
      }

      const verified = await verifyAppLockPin(currentPin);

      if (!verified) {
        return { ok: false as const, reason: "invalidPin" as const };
      }

      const pinResult = await savePinToKeyring(newPin, confirmPin);

      if (!pinResult.ok) {
        return pinResult;
      }

      return { ok: true as const };
    },
    []
  );

  const disableAppLock = useCallback(
    async (pin: string) => {
      if (!settings.enabled) {
        return { ok: true as const, persisted: true };
      }

      const verified = await verifyAppLockPin(pin);

      if (!verified) {
        return { ok: false as const, reason: "invalidPin" as const };
      }

      try {
        await removeAppLockPin();
        setHasPin(false);
        setIsLocked(false);
      } catch {
        return { ok: false as const, reason: "removePinFailed" as const };
      }

      const { persisted } = await updateSettings({ enabled: false });

      return { ok: true as const, persisted };
    },
    [settings.enabled, updateSettings]
  );

  const value = useMemo(
    () => ({
      settings,
      hasPin,
      isLocked,
      updateSettings,
      refreshHasPin,
      lock,
      unlock,
      enableAppLock,
      changePin,
      disableAppLock,
    }),
    [
      changePin,
      disableAppLock,
      enableAppLock,
      hasPin,
      isLocked,
      lock,
      refreshHasPin,
      settings,
      unlock,
      updateSettings,
    ]
  );

  return (
    <AppLockContext.Provider value={value}>{children}</AppLockContext.Provider>
  );
}
