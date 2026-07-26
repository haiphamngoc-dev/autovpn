import {
  Box,
  SegmentedControl,
  Select,
  Text,
  useMantineColorScheme,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { useLanguageOptions, useThemeOptions } from "@shared/i18n/options";
import { changeAppLanguage } from "@shared/i18n";
import { saveAppearanceSettings } from "@shared/settings/appearance";
import { IconLanguage } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { settingCardStyles } from "@shared/layout";
import { SettingField } from "./SettingField";

export function AppearanceCard() {
  const { t, i18n } = useTranslation();
  const { colorScheme, setColorScheme } = useMantineColorScheme();
  const themeOptions = useThemeOptions();
  const languageOptions = useLanguageOptions();

  return (
    <Box className={settingCardStyles.card}>
      <Text className={settingCardStyles.sectionTitle} mb="md">
        {t("settings.appearance.title")}
      </Text>

      <SettingField
        label={t("settings.appearance.theme.label")}
        description={t("settings.appearance.theme.description")}
      >
        <SegmentedControl
          fullWidth
          value={
            colorScheme === "light" || colorScheme === "dark"
              ? colorScheme
              : "dark"
          }
          onChange={(value) => {
            void (async () => {
              const nextScheme = value as "light" | "dark";
              setColorScheme(nextScheme);

              const { persisted } = await saveAppearanceSettings({
                colorScheme: nextScheme,
              });

              notifications.show(
                persisted
                  ? {
                      title: t(
                        "settings.appearance.notifications.themeSaved.title"
                      ),
                      message: t(
                        "settings.appearance.notifications.themeSaved.message",
                        { theme: t(`settings.theme.${nextScheme}`) }
                      ),
                      color: "green",
                    }
                  : {
                      title: t(
                        "settings.appearance.notifications.themeSaveFailed.title"
                      ),
                      message: t(
                        "settings.appearance.notifications.themeSaveFailed.message"
                      ),
                      color: "red",
                    }
              );
            })();
          }}
          data={themeOptions}
        />
      </SettingField>

      <SettingField
        label={t("settings.appearance.language.label")}
        description={t("settings.appearance.language.description")}
      >
        <Select
          value={i18n.language}
          onChange={(value) => {
            void (async () => {
              const nextLanguage = await changeAppLanguage(value ?? "en");
              const { persisted } = await saveAppearanceSettings({
                language: nextLanguage,
              });

              notifications.show(
                persisted
                  ? {
                      title: t(
                        "settings.appearance.notifications.languageSaved.title"
                      ),
                      message: t(
                        "settings.appearance.notifications.languageSaved.message",
                        {
                          language: t(`settings.languages.${nextLanguage}`),
                        }
                      ),
                      color: "green",
                    }
                  : {
                      title: t(
                        "settings.appearance.notifications.languageSaveFailed.title"
                      ),
                      message: t(
                        "settings.appearance.notifications.languageSaveFailed.message"
                      ),
                      color: "red",
                    }
              );
            })();
          }}
          data={languageOptions}
          leftSection={<IconLanguage size={16} stroke={1.5} />}
          allowDeselect={false}
        />
      </SettingField>
    </Box>
  );
}
