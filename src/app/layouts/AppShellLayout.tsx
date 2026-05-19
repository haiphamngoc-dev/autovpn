import { WindowResizeHandles } from "@shared/components/WindowResizeHandles";
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
        <>
          <AppShell.Header>
            <WindowTitleBar />
          </AppShell.Header>
          <WindowResizeHandles />
        </>
      ) : undefined}
      <AppShell.Main h="100%" style={{ minHeight: 0 }}>
        <Outlet />
      </AppShell.Main>
    </AppShell>
  );
}
