import { AppLockOverlay } from "@shared/appLock";
import { WindowResizeHandles } from "@shared/components/WindowResizeHandles";
import { useWindowBehavior } from "@shared/windowBehavior";
import { Box } from "@mantine/core";
import { Outlet } from "react-router-dom";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { useEffect, useState } from "react";
import styles from "./AppLayout.module.css";

const appWindow = getCurrentWindow();

export function AppLayout() {
  const { showCustomTitleBar } = useWindowBehavior();
  const [maximized, setMaximized] = useState(false);

  useEffect(() => {
    const syncMaximized = async () => {
      try {
        const state = await appWindow.isMaximized();
        setMaximized(state);
      } catch {
        setMaximized(false);
      }
    };

    void syncMaximized();
    let unlisten: (() => void) | undefined;
    void appWindow
      .onResized(() => {
        void syncMaximized();
      })
      .then((fn) => {
        unlisten = fn;
      });

    return () => {
      unlisten?.();
    };
  }, []);

  const showBorders = showCustomTitleBar && !maximized;

  return (
    <Box className={`${styles.root} ${showBorders ? styles.bordered : ""}`}>
      {showBorders ? <WindowResizeHandles /> : undefined}
      <Box className={styles.main}>
        <Outlet />
        <AppLockOverlay />
      </Box>
    </Box>
  );
}
