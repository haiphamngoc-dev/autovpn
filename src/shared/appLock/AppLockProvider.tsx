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
    if (!settings.lockWhenIdle || isLocked) {
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
  }, [isLocked, markActivity, settings.idleTimeout, settings.lockWhenIdle]);

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
    setIsLocked(true);
  }, []);

  const unlock = useCallback(
    async (pin: string) => {
      if (!hasPin) {
        setIsLocked(false);
        markActivity();
        return true;
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

  const savePin = useCallback(async (pin: string, confirmPin: string) => {
    if (pin !== confirmPin) {
      return { ok: false as const, reason: "mismatch" as const };
    }

    try {
      await setAppLockPin(pin);
      setHasPin(true);
      return { ok: true as const };
    } catch (error) {
      return {
        ok: false as const,
        reason: "error" as const,
        code: normalizePinErrorCode(getInvokeErrorMessage(error)),
      };
    }
  }, []);

  const removePin = useCallback(async () => {
    try {
      await removeAppLockPin();
      setHasPin(false);
      setIsLocked(false);
      return true;
    } catch {
      return false;
    }
  }, []);

  const value = useMemo(
    () => ({
      settings,
      hasPin,
      isLocked,
      updateSettings,
      refreshHasPin,
      lock,
      unlock,
      savePin,
      removePin,
    }),
    [
      hasPin,
      isLocked,
      lock,
      refreshHasPin,
      removePin,
      savePin,
      settings,
      unlock,
      updateSettings,
    ]
  );

  return (
    <AppLockContext.Provider value={value}>{children}</AppLockContext.Provider>
  );
}
