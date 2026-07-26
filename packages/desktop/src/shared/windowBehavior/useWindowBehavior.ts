import { createContext, useContext } from "react";
import type { WindowBehaviorContextValue } from "./context";

export const WindowBehaviorContext =
  createContext<WindowBehaviorContextValue | null>(null);

export function useWindowBehavior(): WindowBehaviorContextValue {
  const context = useContext(WindowBehaviorContext);

  if (!context) {
    throw new Error(
      "useWindowBehavior must be used within WindowBehaviorProvider"
    );
  }

  return context;
}
