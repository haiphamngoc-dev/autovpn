import { AppHeader } from "@app/components/AppHeader";
import { Box } from "@mantine/core";
import { Outlet } from "react-router-dom";
import styles from "./MainLayout.module.css";

const HEADER_HEIGHT = "3rem";

export function MainLayout() {
  return (
    <Box
      className={styles.root}
      style={{ "--main-layout-header-height": HEADER_HEIGHT }}
    >
      <Box className={styles.north}>
        <AppHeader />
      </Box>
      <Box component="main" className={styles.center}>
        <Outlet />
      </Box>
    </Box>
  );
}
