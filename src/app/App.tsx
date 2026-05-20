import { createTheme, MantineProvider } from "@mantine/core";
import { Notifications } from "@mantine/notifications";
import { AppRoutes } from "@/app/routers/routes";
import { AppLockProvider } from "@shared/appLock";
import { WindowBehaviorProvider } from "@shared/windowBehavior";
import { I18nLanguageSync } from "@shared/i18n/I18nLanguageSync";
import type { AppearanceSettings } from "@shared/settings/appearance";
import type { AppLockSettings } from "@shared/settings/appLock";
import type { WindowBehaviorSettings } from "@shared/settings/windowBehavior";
import { createAppearanceColorSchemeManager } from "@shared/settings/colorSchemeManager";
import { MemoryRouter } from "react-router-dom";

const theme = createTheme({
  primaryColor: "green",
});

type AppProps = {
  appearance: AppearanceSettings;
  appLock: AppLockSettings;
  windowBehavior: WindowBehaviorSettings;
};

export default function App({
  appearance,
  appLock,
  windowBehavior,
}: Readonly<AppProps>) {
  const colorSchemeManager = createAppearanceColorSchemeManager(
    appearance.colorScheme
  );

  return (
    <MantineProvider
      theme={theme}
      colorSchemeManager={colorSchemeManager}
      defaultColorScheme={appearance.colorScheme}
    >
      <Notifications />
      <WindowBehaviorProvider initialSettings={windowBehavior}>
        <AppLockProvider initialSettings={appLock}>
          <MemoryRouter>
            <I18nLanguageSync />
            <AppRoutes />
          </MemoryRouter>
        </AppLockProvider>
      </WindowBehaviorProvider>
    </MantineProvider>
  );
}
