import {
  LANGUAGE_OPTIONS,
  STORAGE_KEYS,
  THEME_OPTIONS,
} from "@features/settings/constants";
import {
  Box,
  SegmentedControl,
  Select,
  Text,
  useMantineColorScheme,
} from "@mantine/core";
import { useLocalStorage } from "@mantine/hooks";
import { IconLanguage } from "@tabler/icons-react";
import styles from "./AppearanceCard.module.css";
import { SettingField } from "./SettingField";

export function AppearanceCard() {
  const { colorScheme, setColorScheme } = useMantineColorScheme();
  const [language, setLanguage] = useLocalStorage({
    key: STORAGE_KEYS.language,
    defaultValue: "en",
  });

  return (
    <Box className={styles.card}>
      <Text className={styles.sectionTitle}>Appearance</Text>

      <SettingField
        label="Theme"
        description="Light or dark interface (saved for this device)."
      >
        <SegmentedControl
          fullWidth
          value={colorScheme}
          onChange={(value) => setColorScheme(value)}
          data={[...THEME_OPTIONS]}
        />
      </SettingField>

      <SettingField
        label="Language"
        description="Interface language (saved for this device)."
      >
        <Select
          value={language}
          onChange={(value) => setLanguage(value ?? "en")}
          data={[...LANGUAGE_OPTIONS]}
          leftSection={<IconLanguage size={16} stroke={1.5} />}
          allowDeselect={false}
        />
      </SettingField>
    </Box>
  );
}
