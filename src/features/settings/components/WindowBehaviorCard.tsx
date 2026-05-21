import { Box, Group, Switch, Text } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { useWindowBehavior } from "@shared/windowBehavior";
import { IconWindow } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { settingCardStyles } from "@shared/layout";

export function WindowBehaviorCard() {
  const { t } = useTranslation();
  const { settings, updateSettings } = useWindowBehavior();

  function notifySettingsSaved(persisted: boolean) {
    notifications.show(
      persisted
        ? {
            title: t("settings.windowBehavior.notifications.saved.title"),
            message: t("settings.windowBehavior.notifications.saved.message"),
            color: "green",
          }
        : {
            title: t("settings.windowBehavior.notifications.saveFailed.title"),
            message: t(
              "settings.windowBehavior.notifications.saveFailed.message"
            ),
            color: "red",
          }
    );
  }

  return (
    <Box className={settingCardStyles.card}>
      <Group gap={6} mb="xs" wrap="nowrap">
        <IconWindow
          size={16}
          stroke={1.5}
          color="var(--mantine-color-dimmed)"
        />
        <Text className={settingCardStyles.sectionTitle} mb={0}>
          {t("settings.windowBehavior.title")}
        </Text>
      </Group>

      <Text className={settingCardStyles.cardDescription}>
        {t("settings.windowBehavior.description")}
      </Text>

      <Switch
        label={t("settings.windowBehavior.useSystemWindowFrame")}
        description={t(
          "settings.windowBehavior.useSystemWindowFrameDescription"
        )}
        checked={settings.useSystemWindowFrame}
        onChange={(event) => {
          void (async () => {
            const { persisted } = await updateSettings({
              useSystemWindowFrame: event.currentTarget.checked,
            });
            notifySettingsSaved(persisted);
          })();
        }}
        color="green"
        mb="md"
      />

      <Switch
        label={t("settings.windowBehavior.closeToTray")}
        description={t("settings.windowBehavior.closeToTrayDescription")}
        checked={settings.closeToTray}
        onChange={(event) => {
          void (async () => {
            const { persisted } = await updateSettings({
              closeToTray: event.currentTarget.checked,
            });
            notifySettingsSaved(persisted);
          })();
        }}
        color="green"
      />
    </Box>
  );
}
