import { createTheme, MantineProvider } from "@mantine/core";
import { Notifications } from "@mantine/notifications";
import { AppRoutes } from "@/app/routers/routes";
import { I18nLanguageSync } from "@shared/i18n/I18nLanguageSync";
import type { AppearanceSettings } from "@shared/settings/appearance";
import { createAppearanceColorSchemeManager } from "@shared/settings/colorSchemeManager";
import { MemoryRouter } from "react-router-dom";

const theme = createTheme({
  primaryColor: "green",
});

type AppProps = {
  appearance: AppearanceSettings;
};

export default function App({ appearance }: Readonly<AppProps>) {
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
      <MemoryRouter>
        <I18nLanguageSync />
        <AppRoutes />
      </MemoryRouter>
    </MantineProvider>
  );
}
