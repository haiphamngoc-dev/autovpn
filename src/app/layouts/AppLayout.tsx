import { WindowResizeHandles } from "@shared/components/WindowResizeHandles";
import { WindowTitleBar } from "@shared/components/WindowTitleBar";
import { isLinux } from "@shared/lib/platform";
import { Box } from "@mantine/core";
import { Outlet } from "react-router-dom";
import styles from "./AppLayout.module.css";

export function AppLayout() {
  return (
    <Box className={styles.root}>
      {isLinux ? (
        <>
          <Box className={styles.titlebar}>
            <WindowTitleBar />
          </Box>
          <WindowResizeHandles />
        </>
      ) : undefined}
      <Box className={styles.main}>
        <Outlet />
      </Box>
    </Box>
  );
}
