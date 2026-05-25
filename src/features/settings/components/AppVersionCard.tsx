import { Box, Button, Group, Text, Badge, Progress, Alert } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { IconInfoCircle, IconRefresh, IconCloudDownload, IconCircleCheck, IconAlertCircle } from "@tabler/icons-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { settingCardStyles } from "@shared/layout";
import { getVersion } from "@tauri-apps/api/app";
import { check } from "@tauri-apps/plugin-updater";

type UpdateState = "idle" | "checking" | "available" | "downloading" | "upToDate" | "error";

export function AppVersionCard() {
  const { t } = useTranslation();
  const [currentVersion, setCurrentVersion] = useState<string>("...");
  const [checking, setChecking] = useState(false);
  const [updateState, setUpdateState] = useState<UpdateState>("idle");
  const [newVersion, setNewVersion] = useState<string>("");
  const [changelog, setChangelog] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [updateObj, setUpdateObj] = useState<any>(null);

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
        setUpdateObj(update);
        setNewVersion(update.version);
        setChangelog(update.body || "");
        setUpdateState("available");
        
        notifications.show({
          title: t("settings.update.notifications.available.title", { defaultValue: "New Version Available" }),
          message: t("settings.update.notifications.available.message", { version: update.version, defaultValue: `Version ${update.version} is ready to download.` }),
          color: "blue",
          autoClose: 8000,
        });
      } else {
        setUpdateState("upToDate");
        notifications.show({
          title: t("settings.update.notifications.upToDate.title", { defaultValue: "Up to Date" }),
          message: t("settings.update.notifications.upToDate.message", { defaultValue: "You are already using the latest version of AutoVPN." }),
          color: "green",
        });
      }
    } catch (err: any) {
      setChecking(false);
      setUpdateState("error");
      const errMsg = err?.toString() || "Unknown error occurred";
      setErrorMessage(errMsg);
      
      notifications.show({
        title: t("settings.update.notifications.error.title", { defaultValue: "Update Check Failed" }),
        message: errMsg,
        color: "red",
      });
    }
  };

  const handleInstallUpdate = async () => {
    if (!updateObj) return;

    setUpdateState("downloading");
    try {
      // Start download and installation
      await updateObj.downloadAndInstall();
      setUpdateState("upToDate");
      
      notifications.show({
        title: t("settings.update.notifications.success.title", { defaultValue: "Update Completed" }),
        message: t("settings.update.notifications.success.message", { defaultValue: "AutoVPN has been upgraded successfully! Please restart the application to apply the changes." }),
        color: "green",
        autoClose: false,
      });
    } catch (err: any) {
      setUpdateState("error");
      const errMsg = err?.toString() || "Failed to download update";
      setErrorMessage(errMsg);
      
      notifications.show({
        title: t("settings.update.notifications.installFailed.title", { defaultValue: "Installation Failed" }),
        message: errMsg,
        color: "red",
      });
    }
  };

  return (
    <Box className={settingCardStyles.card}>
      <Group gap={6} mb="md" wrap="nowrap">
        <IconInfoCircle size={16} stroke={1.5} color="var(--mantine-color-dimmed)" />
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
            {t("settings.update.currentVersion", { defaultValue: "Current version" })}: v{currentVersion}
          </Text>
        </Box>

        {updateState === "upToDate" && (
          <Badge variant="light" color="green" leftSection={<IconCircleCheck size={12} />}>
            {t("settings.update.badges.upToDate", { defaultValue: "Up to Date" })}
          </Badge>
        )}

        {updateState === "available" && (
          <Badge variant="dot" color="blue">
            {t("settings.update.badges.available", { defaultValue: "Update Available" })}
          </Badge>
        )}
      </Group>

      {updateState === "available" && (
        <Alert variant="light" color="blue" title={`Version v${newVersion} is available`} icon={<IconInfoCircle />} mb="md">
          {changelog && (
            <Text size="xs" style={{ whiteSpace: "pre-line", maxHeight: "100px", overflowY: "auto" }} mb="sm">
              {changelog}
            </Text>
          )}
          <Button
            size="xs"
            leftSection={<IconCloudDownload size={14} />}
            onClick={handleInstallUpdate}
            fullWidth
          >
            {t("settings.update.actions.downloadInstall", { defaultValue: "Download & Install Update" })}
          </Button>
        </Alert>
      )}

      {updateState === "downloading" && (
        <Box mb="md">
          <Text size="xs" c="dimmed" mb={5}>
            {t("settings.update.states.downloading", { defaultValue: "Downloading and applying update..." })}
          </Text>
          <Progress value={100} animated color="blue" size="sm" />
        </Box>
      )}

      {updateState === "error" && (
        <Alert variant="light" color="red" title="Update failed" icon={<IconAlertCircle />} mb="md">
          <Text size="xs">{errorMessage}</Text>
        </Alert>
      )}

      <Button
        variant="outline"
        size="xs"
        loading={checking}
        onClick={handleCheckForUpdates}
        disabled={updateState === "downloading"}
        leftSection={!checking && <IconRefresh size={14} />}
        fullWidth
      >
        {checking
          ? t("settings.update.actions.checking", { defaultValue: "Checking..." })
          : t("settings.update.actions.check", { defaultValue: "Check for Updates" })}
      </Button>
    </Box>
  );
}
