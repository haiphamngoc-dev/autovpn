import { SettingField } from "@features/settings/components/SettingField";
import {
  loadVpnSettings,
  saveVpnSettings,
  type AutoReconnectSettings,
} from "@shared/settings/vpn";
import { Box, Group, Loader, NumberInput, Switch, Text } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { IconRefresh } from "@tabler/icons-react";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { settingCardStyles } from "@shared/layout";

export function AutoReconnectCard() {
  const { t } = useTranslation();
  const [settings, setSettings] = useState<AutoReconnectSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const vpnSettings = await loadVpnSettings();
      if (!cancelled) {
        setSettings(vpnSettings.autoReconnect);
        setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const updateSettings = useCallback(
    async (partial: Partial<AutoReconnectSettings>) => {
      const { settings: nextVpnSettings, persisted } = await saveVpnSettings({
        autoReconnect: partial as AutoReconnectSettings,
      });
      setSettings(nextVpnSettings.autoReconnect);
      return { persisted };
    },
    []
  );

  function notifySettingsSaved(persisted: boolean) {
    notifications.show(
      persisted
        ? {
            title: t("settings.autoReconnect.notifications.saved.title"),
            message: t("settings.autoReconnect.notifications.saved.message"),
            color: "green",
          }
        : {
            title: t("settings.autoReconnect.notifications.saveFailed.title"),
            message: t(
              "settings.autoReconnect.notifications.saveFailed.message"
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
        <IconRefresh
          size={16}
          stroke={1.5}
          color="var(--mantine-color-dimmed)"
        />
        <Text className={settingCardStyles.sectionTitle} mb={0}>
          {t("settings.autoReconnect.title")}
        </Text>
      </Group>

      <Switch
        label={t("settings.autoReconnect.enabled")}
        description={t("settings.autoReconnect.enabledDescription")}
        checked={settings.enabled}
        onChange={(event) => {
          void (async () => {
            const { persisted } = await updateSettings({
              enabled: event.currentTarget.checked,
            });
            notifySettingsSaved(persisted);
          })();
        }}
        color="green"
        mb="md"
      />

      <SettingField label={t("settings.autoReconnect.maxAttempts")}>
        <NumberInput
          value={settings.maxAttempts}
          onChange={(value) => {
            if (typeof value !== "number") {
              return;
            }

            void (async () => {
              const { persisted } = await updateSettings({
                maxAttempts: value,
              });
              notifySettingsSaved(persisted);
            })();
          }}
          min={1}
          max={10}
          disabled={!settings.enabled}
        />
      </SettingField>
    </Box>
  );
}
