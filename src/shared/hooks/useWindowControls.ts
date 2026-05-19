import { getCurrentWindow } from "@tauri-apps/api/window";
import { useCallback, useEffect, useState, type MouseEvent } from "react";

const appWindow = getCurrentWindow();

export function useWindowControls() {
  const [maximized, setMaximized] = useState(false);

  const syncMaximized = useCallback(() => {
    void appWindow.isMaximized().then(setMaximized);
  }, []);

  useEffect(() => {
    syncMaximized();
    let unlisten: (() => void) | undefined;
    void appWindow
      .onResized(() => {
        syncMaximized();
      })
      .then((fn) => {
        unlisten = fn;
      });
    return () => {
      unlisten?.();
    };
  }, [syncMaximized]);

  const minimize = useCallback(() => {
    void appWindow.minimize();
  }, []);

  const toggleMaximize = useCallback(() => {
    void appWindow.toggleMaximize().then(syncMaximized);
  }, [syncMaximized]);

  const close = useCallback(() => {
    void appWindow.close();
  }, []);

  const startDrag = useCallback((event: MouseEvent) => {
    if (event.button !== 0) return;
    const target = event.target as HTMLElement;
    if (target.closest("button, a, input, textarea, select, [data-no-drag]")) {
      return;
    }
    void appWindow.startDragging();
  }, []);

  return {
    maximized,
    minimize,
    toggleMaximize,
    close,
    startDrag,
  };
}
