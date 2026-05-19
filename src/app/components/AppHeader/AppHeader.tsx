import { ActionIcon, Box, Group, Text } from "@mantine/core";
import { IconArrowLeft, IconSettings } from "@tabler/icons-react";
import { paths } from "@app/routers/paths";
import { useLocation, useNavigate } from "react-router-dom";
import styles from "./AppHeader.module.css";

const APP_NAME = "autovpn";
const ICON_SIZE = 24;
const ICON_STROKE = 1.5;

export function AppHeader() {
  const navigate = useNavigate();
  const location = useLocation();
  const isSettings = location.pathname === paths.settings;

  return (
    <Box component="header" className={styles.root}>
      <Group
        justify="space-between"
        align="center"
        w="100%"
        h="100%"
        wrap="nowrap"
      >
        {isSettings ? (
          <Group gap="xs" wrap="nowrap" align="center">
            <ActionIcon
              variant="subtle"
              size="md"
              aria-label="Back"
              title="Back"
              onClick={() => navigate(paths.home)}
            >
              <IconArrowLeft
                size={ICON_SIZE}
                color="var(--mantine-color-text)"
                stroke={ICON_STROKE}
              />
            </ActionIcon>
            <Text component="h1" size="sm" fw={600} m={0}>
              Settings
            </Text>
          </Group>
        ) : (
          <>
            <Text component="h1" size="sm" fw={600} m={0}>
              {APP_NAME}
            </Text>
            <ActionIcon
              variant="subtle"
              size="md"
              aria-label="Settings"
              title="Settings"
              onClick={() => navigate(paths.settings)}
            >
              <IconSettings
                size={ICON_SIZE}
                color="var(--mantine-color-text)"
                stroke={ICON_STROKE}
              />
            </ActionIcon>
          </>
        )}
      </Group>
    </Box>
  );
}
