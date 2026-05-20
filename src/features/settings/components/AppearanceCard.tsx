import { STORAGE_KEYS } from "@features/settings/constants";
import {
  Box,
  SegmentedControl,
  Select,
  Text,
  useMantineColorScheme,
} from "@mantine/core";
import { useLocalStorage } from "@mantine/hooks";
import { changeAppLanguage } from "@shared/i18n";
import { useLanguageOptions, useThemeOptions } from "@shared/i18n/options";
import { IconLanguage } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import styles from "./AppearanceCard.module.css";
import { SettingField } from "./SettingField";

export function AppearanceCard() {
  const { t } = useTranslation();
  const { colorScheme, setColorScheme } = useMantineColorScheme();
  const themeOptions = useThemeOptions();
  const languageOptions = useLanguageOptions();
  const [language, setLanguage] = useLocalStorage({
    key: STORAGE_KEYS.language,
    defaultValue: "en",
  });

  return (
    <Box className={styles.card}>
      <Text className={styles.sectionTitle}>
        {t("settings.appearance.title")}
      </Text>

      <SettingField
        label={t("settings.appearance.theme.label")}
        description={t("settings.appearance.theme.description")}
      >
        <SegmentedControl
          fullWidth
          value={colorScheme}
          onChange={(value) => setColorScheme(value as "light" | "dark")}
          data={themeOptions}
        />
      </SettingField>

      <SettingField
        label={t("settings.appearance.language.label")}
        description={t("settings.appearance.language.description")}
      >
        <Select
          value={language}
          onChange={(value) => {
            const nextLanguage = changeAppLanguage(value ?? "en");
            setLanguage(nextLanguage);
          }}
          data={languageOptions}
          leftSection={<IconLanguage size={16} stroke={1.5} />}
          allowDeselect={false}
        />
      </SettingField>
    </Box>
  );
}
