import { Box, Group, Text } from "@mantine/core";
import { useVpnStatus, type VpnConnectionStatus } from "@shared/vpn";
import { useTranslation } from "react-i18next";
import packageJson from "../../../../package.json";
import styles from "./AppFooter.module.css";

const STATUS_DOT_CLASS: Record<VpnConnectionStatus, string> = {
  connected: styles.statusDotConnected,
  connecting: styles.statusDotConnecting,
  disconnected: styles.statusDot,
};

export function AppFooter() {
  const { t } = useTranslation();
  const { status } = useVpnStatus();
  const statusDotClass = STATUS_DOT_CLASS[status];

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
          <Box className={statusDotClass} aria-hidden />
          <Text size="xs" c="dimmed">
            {t(`header.status.${status}`)}
          </Text>
        </Group>
        <Text size="xs" c="dimmed">
          {t("footer.version", { version: packageJson.version })}
        </Text>
      </Group>
    </Box>
  );
}
