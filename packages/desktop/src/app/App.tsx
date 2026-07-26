import { createTheme, MantineProvider } from "@mantine/core";
import { Notifications, notifications } from "@mantine/notifications";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { AppRoutes } from "@/app/routers/routes";
import { AppLockProvider } from "@shared/appLock";
import { VpnStatusProvider } from "@shared/vpn";
import { WindowBehaviorProvider } from "@shared/windowBehavior";
import { I18nLanguageSync } from "@shared/i18n/I18nLanguageSync";
import type { AppearanceSettings } from "@shared/settings/appearance";
import type { AppLockSettings } from "@shared/settings/appLock";
import type { WindowBehaviorSettings } from "@shared/settings/windowBehavior";
import { createAppearanceColorSchemeManager } from "@shared/settings/colorSchemeManager";
import { MemoryRouter } from "react-router-dom";

const theme = createTheme({
  primaryColor: "emerald",
  colors: {
    emerald: [
      "#ecfdf5",
      "#d1fae5",
      "#a7f3d0",
      "#6ee7b7",
      "#34d399",
      "#10b981",
      "#059669",
      "#047857",
      "#065f46",
      "#064e3b",
    ],
  },
  defaultRadius: "md",
});

type AppProps = {
  appearance: AppearanceSettings;
  appLock: AppLockSettings;
  windowBehavior: WindowBehaviorSettings;
  hasPin: boolean;
  settingsTampered?: boolean;
};

function SettingsTamperedNotice({ show }: Readonly<{ show: boolean }>) {
  const { t } = useTranslation();

  useEffect(() => {
    if (!show) {
      return;
    }

    notifications.show({
      title: t("appLock.tampered.title"),
      message: t("appLock.tampered.message"),
      color: "red",
      autoClose: false,
    });
  }, [show, t]);

  return null;
}

export default function App({
  appearance,
  appLock,
  windowBehavior,
  hasPin,
  settingsTampered = false,
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
        <AppLockProvider initialSettings={appLock} initialHasPin={hasPin}>
          <VpnStatusProvider>
            <SettingsTamperedNotice show={settingsTampered} />
            <MemoryRouter>
              <I18nLanguageSync />
              <AppRoutes />
            </MemoryRouter>
          </VpnStatusProvider>
        </AppLockProvider>
      </WindowBehaviorProvider>
    </MantineProvider>
  );
}
