import { useSystemIntegration } from "@shared/systemIntegration";
import { Box, Group, Loader, Switch, Text } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { IconPlugConnected } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { settingCardStyles } from "@shared/layout";

export function SystemIntegrationCard() {
  const { t } = useTranslation();
  const { settings, loading, updateSettings } = useSystemIntegration();

  function notifySettingsSaved(persisted: boolean) {
    notifications.show(
      persisted
        ? {
            title: t("settings.systemIntegration.notifications.saved.title"),
            message: t(
              "settings.systemIntegration.notifications.saved.message"
            ),
            color: "green",
          }
        : {
            title: t(
              "settings.systemIntegration.notifications.saveFailed.title"
            ),
            message: t(
              "settings.systemIntegration.notifications.saveFailed.message"
            ),
            color: "red",
          }
    );
  }

  if (loading || !settings) {
    return (
      <Box className={settingCardStyles.card}>
        <Group justify="center" py="md">
          <Loader size="sm" color="green" />
        </Group>
      </Box>
    );
  }

  return (
    <Box className={settingCardStyles.card}>
      <Group gap={6} mb="xs" wrap="nowrap">
        <IconPlugConnected
          size={16}
          stroke={1.5}
          color="var(--mantine-color-dimmed)"
        />
        <Text className={settingCardStyles.sectionTitle} mb={0}>
          {t("settings.systemIntegration.title")}
        </Text>
      </Group>

      <Text className={settingCardStyles.cardDescription}>
        {t("settings.systemIntegration.description")}
      </Text>

      <Switch
        label={t("settings.systemIntegration.launchAtStartup")}
        description={t("settings.systemIntegration.launchAtStartupDescription")}
        checked={settings.launchAtStartup}
        onChange={(event) => {
          void (async () => {
            const { persisted } = await updateSettings({
              launchAtStartup: event.currentTarget.checked,
            });
            notifySettingsSaved(persisted);
          })();
        }}
        color="green"
        mb="md"
      />

      <Switch
        label={t("settings.systemIntegration.launchMinimized")}
        description={t("settings.systemIntegration.launchMinimizedDescription")}
        checked={settings.launchMinimized}
        onChange={(event) => {
          void (async () => {
            const { persisted } = await updateSettings({
              launchMinimized: event.currentTarget.checked,
            });
            notifySettingsSaved(persisted);
          })();
        }}
        color="green"
      />
    </Box>
  );
}
