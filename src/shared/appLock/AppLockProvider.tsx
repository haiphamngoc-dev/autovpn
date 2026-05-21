import {
  getInvokeErrorMessage,
  hasAppLockPin,
  initAppLockSecrets,
  removeAppLockPin,
  removeAppLockSecrets,
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
  initialHasPin: boolean;
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

function withEnrollmentState(
  settings: AppLockSettings,
  enrolled: boolean
): AppLockSettings {
  return { ...settings, enabled: enrolled };
}

export function AppLockProvider({
  initialSettings,
  initialHasPin,
  children,
}: Readonly<AppLockProviderProps>) {
  const [settings, setSettings] = useState(() =>
    withEnrollmentState(initialSettings, initialHasPin)
  );
  const [hasPin, setHasPin] = useState(initialHasPin);
  const [isLocked, setIsLocked] = useState(initialHasPin);
  const lastActivityRef = useRef(0);

  const markActivity = useCallback(() => {
    lastActivityRef.current = Date.now();
  }, []);

  const refreshHasPin = useCallback(async () => {
    const nextHasPin = await hasAppLockPin();
    setHasPin(nextHasPin);
    setSettings((current) => withEnrollmentState(current, nextHasPin));

    if (!nextHasPin) {
      setIsLocked(false);
    }

    return nextHasPin;
  }, []);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const nextHasPin = await hasAppLockPin();

      if (cancelled) {
        return;
      }

      setHasPin(nextHasPin);
      setSettings((current) => withEnrollmentState(current, nextHasPin));

      if (!nextHasPin) {
        setIsLocked(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    lastActivityRef.current = Date.now();
  }, []);

  useEffect(() => {
    if (!hasPin || !settings.lockWhenIdle || isLocked) {
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
    hasPin,
    isLocked,
    markActivity,
    settings.idleTimeout,
    settings.lockWhenIdle,
  ]);

  const updateSettings = useCallback(
    async (partial: Partial<AppLockSettings>) => {
      const { settings: nextSettings, persisted } =
        await saveAppLockSettings(partial);
      setSettings(withEnrollmentState(nextSettings, hasPin));
      return { persisted };
    },
    [hasPin]
  );

  const lock = useCallback(() => {
    if (!hasPin) {
      return;
    }

    setIsLocked(true);
  }, [hasPin]);

  const unlock = useCallback(
    async (pin: string) => {
      if (!hasPin) {
        return false;
      }

      const verified = await verifyAppLockPin(pin);

      if (verified) {
        setIsLocked(false);
        markActivity();
      } else {
        const stillEnrolled = await refreshHasPin();

        if (!stillEnrolled) {
          setIsLocked(false);
        }
      }

      return verified;
    },
    [hasPin, markActivity, refreshHasPin]
  );

  const enableAppLock = useCallback(
    async (pin: string, confirmPin: string) => {
      const pinResult = await savePinToKeyring(pin, confirmPin);

      if (!pinResult.ok) {
        return pinResult;
      }

      try {
        await initAppLockSecrets();
      } catch (error) {
        return {
          ok: false as const,
          reason: "error" as const,
          code: normalizePinErrorCode(getInvokeErrorMessage(error)),
        };
      }

      const stored = await hasAppLockPin();

      if (!stored) {
        return {
          ok: false as const,
          reason: "error" as const,
          code: "pin_not_persisted",
        };
      }

      setHasPin(true);
      const { persisted } = await updateSettings({
        lockWhenIdle: true,
        idleTimeout: "5",
      });

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
      if (!hasPin) {
        return { ok: true as const, persisted: true };
      }

      const verified = await verifyAppLockPin(pin);

      if (!verified) {
        return { ok: false as const, reason: "invalidPin" as const };
      }

      try {
        await removeAppLockPin();
        await removeAppLockSecrets();
        setHasPin(false);
        setIsLocked(false);
      } catch {
        return { ok: false as const, reason: "removePinFailed" as const };
      }

      const { persisted } = await saveAppLockSettings({
        enabled: false,
        lockWhenIdle: true,
        idleTimeout: "5",
      });
      setSettings((current) =>
        withEnrollmentState(
          { ...current, lockWhenIdle: true, idleTimeout: "5" },
          false
        )
      );

      return { ok: true as const, persisted };
    },
    [hasPin]
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
