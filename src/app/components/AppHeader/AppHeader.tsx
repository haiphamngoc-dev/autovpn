import { ActionIcon, Box, Group, Text } from "@mantine/core";
import { IconSettings } from "@tabler/icons-react";
import styles from "./AppHeader.module.css";

const APP_NAME = "autovpn";

export function AppHeader() {
  return (
    <Box component="header" className={styles.root}>
      <Group
        justify="space-between"
        align="center"
        w="100%"
        h="100%"
        wrap="nowrap"
      >
        <Text component="h1" size="sm" fw={600} m={0}>
          {APP_NAME}
        </Text>
        <ActionIcon
          variant="subtle"
          size="md"
          aria-label="Settings"
          title="Settings"
        >
          <IconSettings
            size={24}
            color="var(--mantine-color-text)"
            stroke={1.5}
          />
        </ActionIcon>
      </Group>
    </Box>
  );
}
