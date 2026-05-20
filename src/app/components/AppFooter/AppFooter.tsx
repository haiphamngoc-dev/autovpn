import { Box, Group, Text } from "@mantine/core";
import packageJson from "../../../../package.json";
import styles from "./AppFooter.module.css";

const CONNECTION_STATUS = "Disconnected";

export function AppFooter() {
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
            {CONNECTION_STATUS}
          </Text>
        </Group>
        <Text size="xs" c="dimmed">
          v{packageJson.version}
        </Text>
      </Group>
    </Box>
  );
}
