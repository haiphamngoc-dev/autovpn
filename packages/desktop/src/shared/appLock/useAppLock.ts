import { createContext, useContext } from "react";
import type { AppLockContextValue } from "./context";

export const AppLockContext = createContext<AppLockContextValue | null>(null);

export function useAppLock(): AppLockContextValue {
  const context = useContext(AppLockContext);

  if (!context) {
    throw new Error("useAppLock must be used within AppLockProvider");
  }

  return context;
}
