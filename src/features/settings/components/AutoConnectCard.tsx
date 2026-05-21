import { loadVpnSettings, saveVpnSettings } from "@shared/settings/vpn";
import { Box, Group, Loader, Switch, Text } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { IconPlugConnected } from "@tabler/icons-react";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { settingCardStyles } from "@shared/layout";

export function AutoConnectCard() {
  const { t } = useTranslation();
  const [autoConnect, setAutoConnect] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const vpnSettings = await loadVpnSettings();
      if (!cancelled) {
        setAutoConnect(vpnSettings.autoConnect);
        setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const updateAutoConnect = useCallback(async (enabled: boolean) => {
    const { settings: nextSettings, persisted } = await saveVpnSettings({
      autoConnect: enabled,
    });
    setAutoConnect(nextSettings.autoConnect);
    return { persisted };
  }, []);

  function notifySettingsSaved(persisted: boolean) {
    notifications.show(
      persisted
        ? {
            title: t("settings.autoConnect.notifications.saved.title"),
            message: t("settings.autoConnect.notifications.saved.message"),
            color: "green",
          }
        : {
            title: t("settings.autoConnect.notifications.saveFailed.title"),
            message: t("settings.autoConnect.notifications.saveFailed.message"),
            color: "red",
          }
    );
  }

  if (loading) {
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
          {t("settings.autoConnect.title")}
        </Text>
      </Group>

      <Switch
        label={t("settings.autoConnect.enabled")}
        description={t("settings.autoConnect.enabledDescription")}
        checked={autoConnect}
        onChange={(event) => {
          void (async () => {
            const { persisted } = await updateAutoConnect(
              event.currentTarget.checked
            );
            notifySettingsSaved(persisted);
          })();
        }}
        color="green"
      />
    </Box>
  );
}
