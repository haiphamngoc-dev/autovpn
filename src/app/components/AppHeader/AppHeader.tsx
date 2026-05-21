import { ActionIcon, Box, Group, Text } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { useAppLock } from "@shared/appLock";
import { IconArrowLeft, IconLock, IconSettings } from "@tabler/icons-react";
import { paths } from "@app/routers/paths";
import { useTranslation } from "react-i18next";
import { useLocation, useNavigate } from "react-router-dom";
import styles from "./AppHeader.module.css";

const ICON_SIZE = 24;
const ICON_STROKE = 1.5;

export function AppHeader() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { hasPin, lock } = useAppLock();
  const isSettings = location.pathname === paths.settings;

  function handleLockNow() {
    lock();

    notifications.show({
      title: t("settings.appLock.notifications.locked.title"),
      message: t("settings.appLock.notifications.locked.messageWithPin"),
      color: "green",
    });
  }

  const lockButton = hasPin ? (
    <ActionIcon
      variant="subtle"
      size="md"
      aria-label={t("common.lock")}
      title={t("common.lock")}
      onClick={handleLockNow}
    >
      <IconLock
        size={ICON_SIZE}
        color="var(--mantine-color-text)"
        stroke={ICON_STROKE}
      />
    </ActionIcon>
  ) : null;

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
          <>
            <Group gap="xs" wrap="nowrap" align="center">
              <ActionIcon
                variant="subtle"
                size="md"
                aria-label={t("common.back")}
                title={t("common.back")}
                onClick={() => navigate(paths.home)}
              >
                <IconArrowLeft
                  size={ICON_SIZE}
                  color="var(--mantine-color-text)"
                  stroke={ICON_STROKE}
                />
              </ActionIcon>
              <Text component="h1" size="md" fw={600} m={0}>
                {t("common.settings")}
              </Text>
            </Group>
            {lockButton}
          </>
        ) : (
          <>
            <Text component="h1" size="md" fw={600} m={0}>
              {t("app.name")}
            </Text>
            <Group gap={4} wrap="nowrap">
              {lockButton}
              <ActionIcon
                variant="subtle"
                size="md"
                aria-label={t("common.settings")}
                title={t("common.settings")}
                onClick={() => navigate(paths.settings)}
              >
                <IconSettings
                  size={ICON_SIZE}
                  color="var(--mantine-color-text)"
                  stroke={ICON_STROKE}
                />
              </ActionIcon>
            </Group>
          </>
        )}
      </Group>
    </Box>
  );
}
