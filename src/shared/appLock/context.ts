import type { AppLockSettings } from "@shared/settings/appLock";

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
  savePin: (
    pin: string,
    confirmPin: string
  ) => Promise<
    | { ok: true }
    | { ok: false; reason: "mismatch" }
    | { ok: false; reason: "error"; code: string }
  >;
  removePin: () => Promise<boolean>;
};
