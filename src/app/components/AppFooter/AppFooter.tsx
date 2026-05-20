import { Box, Group, Text } from "@mantine/core";
import { useTranslation } from "react-i18next";
import packageJson from "../../../../package.json";
import styles from "./AppFooter.module.css";

export function AppFooter() {
  const { t } = useTranslation();

  return (
    <Box component="footer" className={styles.root}>
      <Group
        justify="space-between"
        align="center"
        w="100%"
        h="100%"
        wrap="nowrap"
      >
        <Group gap="xs" wrap="nowrap" align="center">
          <Box className={styles.statusDot} aria-hidden />
          <Text size="xs" c="dimmed">
            {t("footer.disconnected")}
          </Text>
        </Group>
        <Text size="xs" c="dimmed">
          {t("footer.version", { version: packageJson.version })}
        </Text>
      </Group>
    </Box>
  );
}
