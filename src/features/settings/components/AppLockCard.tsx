import {
  Box,
  Button,
  Group,
  PasswordInput,
  Select,
  Switch,
  Text,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { useAppLock } from "@shared/appLock";
import { getPinErrorMessage } from "@shared/appLock/pinErrors";
import { useIdleTimeoutOptions } from "@shared/i18n/options";
import { IconLock } from "@tabler/icons-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import styles from "./AppLockCard.module.css";
import { DisableAppLockModal } from "./DisableAppLockModal";
import { SettingField } from "./SettingField";

export function AppLockCard() {
  const { t } = useTranslation();
  const idleTimeoutOptions = useIdleTimeoutOptions();
  const {
    settings,
    hasPin,
    updateSettings,
    lock,
    savePin,
    removePin,
    disableAppLock,
  } = useAppLock();
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [isSavingPin, setIsSavingPin] = useState(false);
  const [disableModalOpen, setDisableModalOpen] = useState(false);
  const [isDisabling, setIsDisabling] = useState(false);

  function notifySettingsSaved(persisted: boolean) {
    notifications.show(
      persisted
        ? {
            title: t("settings.appLock.notifications.settingsSaved.title"),
            message: t("settings.appLock.notifications.settingsSaved.message"),
            color: "green",
          }
        : {
            title: t("settings.appLock.notifications.settingsSaveFailed.title"),
            message: t(
              "settings.appLock.notifications.settingsSaveFailed.message"
            ),
            color: "red",
          }
    );
  }

  function handleLockNow() {
    lock();

    notifications.show({
      title: t("settings.appLock.notifications.locked.title"),
      message: hasPin
        ? t("settings.appLock.notifications.locked.messageWithPin")
        : t("settings.appLock.notifications.locked.messageWithoutPin"),
      color: "green",
    });
  }

  async function handleRemovePin() {
    const removed = await removePin();
    setPin("");
    setConfirmPin("");

    notifications.show(
      removed
        ? {
            title: t("settings.appLock.notifications.pinRemoved.title"),
            message: t("settings.appLock.notifications.pinRemoved.message"),
            color: "green",
          }
        : {
            title: t("settings.appLock.notifications.pinRemoveFailed.title"),
            message: t(
              "settings.appLock.notifications.pinRemoveFailed.message"
            ),
            color: "red",
          }
    );
  }

  async function handleSavePin() {
    setIsSavingPin(true);

    try {
      const result = await savePin(pin, confirmPin);

      if (!result.ok && result.reason === "mismatch") {
        notifications.show({
          title: t("settings.appLock.notifications.pinMismatch.title"),
          message: t("settings.appLock.notifications.pinMismatch.message"),
          color: "red",
        });
        return;
      }

      if (!result.ok && result.reason === "error") {
        notifications.show({
          title: t("settings.appLock.notifications.pinSaveFailed.title"),
          message: getPinErrorMessage(result.code, t),
          color: "red",
        });
        return;
      }

      setPin("");
      setConfirmPin("");
      notifications.show({
        title: t("settings.appLock.notifications.pinSaved.title"),
        message: t("settings.appLock.notifications.pinSaved.message"),
        color: "green",
      });
    } finally {
      setIsSavingPin(false);
    }
  }

  async function handleDisableConfirm(
    confirmPin: string
  ): Promise<{ ok: boolean; invalidPin?: boolean }> {
    setIsDisabling(true);

    try {
      const result = await disableAppLock(confirmPin);

      if (!result.ok && result.reason === "invalidPin") {
        return { ok: false, invalidPin: true };
      }

      if (!result.ok && result.reason === "removePinFailed") {
        notifications.show({
          title: t("settings.appLock.notifications.pinRemoveFailed.title"),
          message: t("settings.appLock.notifications.pinRemoveFailed.message"),
          color: "red",
        });
        return { ok: false };
      }

      setDisableModalOpen(false);
      setPin("");
      setConfirmPin("");

      notifications.show(
        result.persisted
          ? {
              title: t("settings.appLock.notifications.disabled.title"),
              message: hasPin
                ? t("settings.appLock.notifications.disabled.messageWithPin")
                : t("settings.appLock.notifications.disabled.message"),
              color: "green",
            }
          : {
              title: t(
                "settings.appLock.notifications.settingsSaveFailed.title"
              ),
              message: t(
                "settings.appLock.notifications.settingsSaveFailed.message"
              ),
              color: "red",
            }
      );

      return { ok: true };
    } finally {
      setIsDisabling(false);
    }
  }

  return (
    <Box className={styles.card}>
      <Group gap={6} mb="xs" wrap="nowrap">
        <IconLock size={16} stroke={1.5} color="var(--mantine-color-dimmed)" />
        <Text className={styles.sectionTitle} mb={0}>
          {t("settings.appLock.title")}
        </Text>
      </Group>

      <Text className={styles.cardDescription}>
        {t("settings.appLock.description")}
      </Text>

      <Switch
        label={t("settings.appLock.enabled")}
        description={t("settings.appLock.enabledDescription")}
        checked={settings.enabled}
        onChange={(event) => {
          const nextEnabled = event.currentTarget.checked;

          if (nextEnabled) {
            void (async () => {
              const { persisted } = await updateSettings({ enabled: true });
              notifySettingsSaved(persisted);
            })();
            return;
          }

          setDisableModalOpen(true);
        }}
        color="green"
        mb="md"
      />

      {settings.enabled ? (
        <>
          <Switch
            label={t("settings.appLock.lockWhenIdle")}
            checked={settings.lockWhenIdle}
            onChange={(event) => {
              void (async () => {
                const lockWhenIdle = event.currentTarget.checked;
                const { persisted } = await updateSettings({ lockWhenIdle });
                notifySettingsSaved(persisted);
              })();
            }}
            color="green"
            mb="md"
          />

          <SettingField label={t("settings.appLock.idleTimeout")}>
            <Select
              value={settings.idleTimeout}
              onChange={(value) => {
                void (async () => {
                  const idleTimeout = (value ??
                    "5") as typeof settings.idleTimeout;
                  const { persisted } = await updateSettings({ idleTimeout });
                  notifySettingsSaved(persisted);
                })();
              }}
              data={idleTimeoutOptions}
              disabled={!settings.lockWhenIdle}
              allowDeselect={false}
            />
          </SettingField>

          <Group gap="sm" mt="md" mb="md" wrap="wrap">
            <Button
              leftSection={<IconLock size={16} stroke={1.5} />}
              color="green"
              onClick={handleLockNow}
            >
              {t("settings.appLock.lockNow")}
            </Button>
            <Button
              variant="subtle"
              color="gray"
              onClick={() => {
                void handleRemovePin();
              }}
              disabled={!hasPin}
            >
              {t("settings.appLock.removePin")}
            </Button>
          </Group>

          <SettingField label={t("settings.appLock.changePin")}>
            <PasswordInput
              value={pin}
              onChange={(event) => setPin(event.currentTarget.value)}
              placeholder={t("settings.appLock.pinPlaceholder")}
            />
          </SettingField>

          <SettingField label={t("settings.appLock.confirmPin")}>
            <PasswordInput
              value={confirmPin}
              onChange={(event) => setConfirmPin(event.currentTarget.value)}
              placeholder={t("settings.appLock.confirmPinPlaceholder")}
            />
          </SettingField>

          <Button
            mt="md"
            color="green"
            loading={isSavingPin}
            disabled={pin.length === 0 || confirmPin.length === 0}
            onClick={() => {
              void handleSavePin();
            }}
          >
            {t("settings.appLock.savePin")}
          </Button>
        </>
      ) : null}

      <DisableAppLockModal
        opened={disableModalOpen}
        hasPin={hasPin}
        loading={isDisabling}
        onClose={() => setDisableModalOpen(false)}
        onConfirm={handleDisableConfirm}
      />
    </Box>
  );
}
