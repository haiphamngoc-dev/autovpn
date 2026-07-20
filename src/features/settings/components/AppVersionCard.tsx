import { Box, Button, Group, Text, Badge, Alert } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import {
  IconInfoCircle,
  IconRefresh,
  IconExternalLink,
  IconCircleCheck,
  IconAlertCircle,
} from "@tabler/icons-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { settingCardStyles } from "@shared/layout";
import { getVersion } from "@tauri-apps/api/app";
import { check } from "@tauri-apps/plugin-updater";
import { openUrl } from "@tauri-apps/plugin-opener";

type UpdateState = "idle" | "checking" | "available" | "upToDate" | "error";

export function AppVersionCard() {
  const { t } = useTranslation();
  const [currentVersion, setCurrentVersion] = useState<string>("...");
  const [checking, setChecking] = useState(false);
  const [updateState, setUpdateState] = useState<UpdateState>("idle");
  const [newVersion, setNewVersion] = useState<string>("");
  const [changelog, setChangelog] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");

  useEffect(() => {
    void getVersion().then((version) => {
      setCurrentVersion(version);
    });
  }, []);

  const handleCheckForUpdates = async () => {
    setChecking(true);
    setUpdateState("checking");
    setErrorMessage("");

    try {
      const update = await check();
      setChecking(false);

      if (update) {
        setNewVersion(update.version);
        setChangelog(update.body || "");
        setUpdateState("available");

        notifications.show({
          title: t("settings.update.notifications.available.title", {
            defaultValue: "New Version Available",
          }),
          message: t("settings.update.notifications.available.message", {
            version: update.version,
            defaultValue: `Version ${update.version} is ready to download.`,
          }),
          color: "blue",
          autoClose: 8000,
        });
      } else {
        setUpdateState("upToDate");
        notifications.show({
          title: t("settings.update.notifications.upToDate.title", {
            defaultValue: "Up to Date",
          }),
          message: t("settings.update.notifications.upToDate.message", {
            defaultValue:
              "You are already using the latest version of AutoVPN.",
          }),
          color: "green",
        });
      }
    } catch (err) {
      setChecking(false);
      setUpdateState("error");
      const errMsg = err instanceof Error ? err.message : String(err);
      setErrorMessage(errMsg);

      notifications.show({
        title: t("settings.update.notifications.error.title", {
          defaultValue: "Update Check Failed",
        }),
        message: errMsg,
        color: "red",
      });
    }
  };

  const handleOpenReleases = async () => {
    if (!newVersion) return;
    try {
      await openUrl(
        `https://github.com/haiphamngoc-dev/autovpn/releases/tag/v${newVersion}`
      );
    } catch (err) {
      notifications.show({
        title: t("settings.update.notifications.openFailed.title", {
          defaultValue: "Could not open link",
        }),
        message: err instanceof Error ? err.message : String(err),
        color: "red",
      });
    }
  };

  return (
    <Box className={settingCardStyles.card}>
      <Group gap={6} mb="md" wrap="nowrap">
        <IconInfoCircle
          size={16}
          stroke={1.5}
          color="var(--mantine-color-dimmed)"
        />
        <Text className={settingCardStyles.sectionTitle} mb={0}>
          {t("settings.update.title", { defaultValue: "Version & Update" })}
        </Text>
      </Group>

      <Group justify="space-between" align="center" mb="sm">
        <Box>
          <Text size="sm" fw={500}>
            AutoVPN
          </Text>
          <Text size="xs" c="dimmed">
            {t("settings.update.currentVersion", {
              defaultValue: "Current version",
            })}
            : v{currentVersion}
          </Text>
        </Box>

        {updateState === "upToDate" && (
          <Badge
            variant="light"
            color="green"
            leftSection={<IconCircleCheck size={12} />}
          >
            {t("settings.update.badges.upToDate", {
              defaultValue: "Up to Date",
            })}
          </Badge>
        )}

        {updateState === "available" && (
          <Badge variant="dot" color="blue">
            {t("settings.update.badges.available", {
              defaultValue: "Update Available",
            })}
          </Badge>
        )}
      </Group>

      {updateState === "available" && (
        <Alert
          variant="light"
          color="blue"
          title={`Version v${newVersion} is available`}
          icon={<IconInfoCircle />}
          mb="md"
        >
          {changelog && (
            <Text
              size="xs"
              style={{
                whiteSpace: "pre-line",
                maxHeight: "100px",
                overflowY: "auto",
              }}
              mb="sm"
            >
              {changelog}
            </Text>
          )}
          <Button
            size="xs"
            variant="filled"
            leftSection={<IconExternalLink size={14} />}
            onClick={handleOpenReleases}
            fullWidth
          >
            {t("settings.update.actions.goToReleases", {
              defaultValue: "Download from GitHub Releases",
            })}
          </Button>
        </Alert>
      )}

      {updateState === "error" && (
        <Alert
          variant="light"
          color="red"
          title="Update failed"
          icon={<IconAlertCircle />}
          mb="md"
        >
          <Text size="xs">{errorMessage}</Text>
        </Alert>
      )}

      <Button
        variant="outline"
        size="xs"
        loading={checking}
        onClick={handleCheckForUpdates}
        leftSection={!checking && <IconRefresh size={14} />}
        fullWidth
      >
        {checking
          ? t("settings.update.actions.checking", {
              defaultValue: "Checking...",
            })
          : t("settings.update.actions.check", {
              defaultValue: "Check for Updates",
            })}
      </Button>
    </Box>
  );
}
