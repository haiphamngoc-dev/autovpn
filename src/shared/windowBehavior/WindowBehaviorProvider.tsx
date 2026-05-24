import { isLinux } from "@shared/lib/platform";
import {
  applyWindowBehaviorSettings,
  saveWindowBehaviorSettings,
  type WindowBehaviorSettings,
} from "@shared/settings/windowBehavior";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useTranslation } from "react-i18next";
import { syncTrayIcon } from "./tray";
import { WindowBehaviorContext } from "./useWindowBehavior";

type WindowBehaviorProviderProps = {
  initialSettings: WindowBehaviorSettings;
  children: ReactNode;
};

export function WindowBehaviorProvider({
  initialSettings,
  children,
}: Readonly<WindowBehaviorProviderProps>) {
  const { t, i18n } = useTranslation();
  const [settings, setSettings] = useState(initialSettings);

  const showCustomTitleBar = isLinux && !settings.useSystemWindowFrame;

  useEffect(() => {
    void applyWindowBehaviorSettings(settings);
  }, [settings]);

  useEffect(() => {
    void syncTrayIcon(settings.closeToTray, {
      show: t("settings.windowBehavior.tray.show"),
      quit: t("settings.windowBehavior.tray.quit"),
      connect: t("settings.windowBehavior.tray.connect"),
      disconnect: t("settings.windowBehavior.tray.disconnect"),
    }).catch((error: unknown) => {
      console.error("Failed to sync tray icon:", error);
    });
  }, [settings.closeToTray, i18n.language, t]);

  const updateSettings = useCallback(
    async (partial: Partial<WindowBehaviorSettings>) => {
      const { settings: nextSettings, persisted } =
        await saveWindowBehaviorSettings(partial);
      setSettings(nextSettings);
      return { persisted };
    },
    []
  );

  const value = useMemo(
    () => ({
      settings,
      showCustomTitleBar,
      updateSettings,
    }),
    [settings, showCustomTitleBar, updateSettings]
  );

  return (
    <WindowBehaviorContext.Provider value={value}>
      {children}
    </WindowBehaviorContext.Provider>
  );
}
