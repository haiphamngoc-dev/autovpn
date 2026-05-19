import { WindowTitleBar } from "@shared/components/WindowTitleBar";
import { isLinux } from "@shared/lib/platform";
import { AppShell } from "@mantine/core";
import { Outlet } from "react-router-dom";

const TITLEBAR_HEIGHT = 32;

export function AppShellLayout() {
  return (
    <AppShell
      header={isLinux ? { height: TITLEBAR_HEIGHT } : undefined}
      padding={0}
    >
      {isLinux ? (
        <AppShell.Header>
          <WindowTitleBar />
        </AppShell.Header>
      ) : undefined}
      <AppShell.Main>
        <Outlet />
      </AppShell.Main>
    </AppShell>
  );
}
