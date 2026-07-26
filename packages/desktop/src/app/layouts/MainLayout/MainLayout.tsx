import { AppFooter } from "@app/components/AppFooter";
import { AppHeader } from "@app/components/AppHeader";
import { AppShell } from "@mantine/core";
import { Outlet } from "react-router-dom";
import styles from "./MainLayout.module.css";

export function MainLayout() {
  return (
    <AppShell
      className={styles.shell}
      mode="static"
      header={{ height: 48 }}
      footer={{ height: 32 }}
      padding={0}
    >
      <AppShell.Header p={0}>
        <AppHeader />
      </AppShell.Header>
      <AppShell.Main className={styles.main}>
        <Outlet />
      </AppShell.Main>
      <AppShell.Footer p={0}>
        <AppFooter />
      </AppShell.Footer>
    </AppShell>
  );
}
