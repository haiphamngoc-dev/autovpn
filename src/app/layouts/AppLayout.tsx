import { AppLockOverlay } from "@shared/appLock";
import { WindowResizeHandles } from "@shared/components/WindowResizeHandles";
import { WindowTitleBar } from "@shared/components/WindowTitleBar";
import { useWindowBehavior } from "@shared/windowBehavior";
import { Box } from "@mantine/core";
import { Outlet } from "react-router-dom";
import styles from "./AppLayout.module.css";

export function AppLayout() {
  const { showCustomTitleBar } = useWindowBehavior();

  return (
    <Box className={styles.root}>
      {showCustomTitleBar ? (
        <>
          <Box className={styles.titlebar}>
            <WindowTitleBar />
          </Box>
          <WindowResizeHandles />
        </>
      ) : undefined}
      <Box className={styles.main}>
        <Outlet />
        <AppLockOverlay />
      </Box>
    </Box>
  );
}
