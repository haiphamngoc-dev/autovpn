import type { AppLockSettings } from "@shared/settings/appLock";

export type SavePinResult =
  | { ok: true }
  | { ok: false; reason: "mismatch" }
  | { ok: false; reason: "error"; code: string };

export type AppLockContextValue = {
  settings: AppLockSettings;
  hasPin: boolean;
  isLocked: boolean;
  updateSettings: (
    partial: Partial<AppLockSettings>
  ) => Promise<{ persisted: boolean }>;
  refreshHasPin: () => Promise<boolean>;
  lock: () => void;
  unlock: (pin: string) => Promise<boolean>;
  enableAppLock: (
    pin: string,
    confirmPin: string
  ) => Promise<
    | { ok: true; persisted: boolean }
    | { ok: false; reason: "mismatch" }
    | { ok: false; reason: "error"; code: string }
  >;
  changePin: (
    currentPin: string,
    newPin: string,
    confirmPin: string
  ) => Promise<
    | { ok: true }
    | { ok: false; reason: "mismatch" }
    | { ok: false; reason: "invalidPin" }
    | { ok: false; reason: "error"; code: string }
  >;
  disableAppLock: (
    pin: string
  ) => Promise<
    | { ok: true; persisted: boolean }
    | { ok: false; reason: "invalidPin" }
    | { ok: false; reason: "removePinFailed" }
  >;
};
