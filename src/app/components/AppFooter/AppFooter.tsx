import { Box, Text } from "@mantine/core";
import { useTranslation } from "react-i18next";
import packageJson from "../../../../package.json";
import styles from "./AppFooter.module.css";

export function AppFooter() {
  const { t } = useTranslation();

  return (
    <Box component="footer" className={styles.root}>
      <Text size="xs" c="dimmed">
        {t("footer.version", { version: packageJson.version })}
      </Text>
    </Box>
  );
}
