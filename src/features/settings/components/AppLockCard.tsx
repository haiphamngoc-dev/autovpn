import { Box, Button, Group, Select, Switch, Text } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { useAppLock } from "@shared/appLock";
import { getPinErrorMessage } from "@shared/appLock/pinErrors";
import { useIdleTimeoutOptions } from "@shared/i18n/options";
import { IconLock } from "@tabler/icons-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import styles from "./AppLockCard.module.css";
import { ChangePinModal } from "./ChangePinModal";
import { DisableAppLockModal } from "./DisableAppLockModal";
import { EnableAppLockModal } from "./EnableAppLockModal";
import { SettingField } from "./SettingField";

export function AppLockCard() {
  const { t } = useTranslation();
  const idleTimeoutOptions = useIdleTimeoutOptions();
  const {
    settings,
    hasPin,
    updateSettings,
    enableAppLock,
    changePin,
    disableAppLock,
  } = useAppLock();
  const [enableModalOpen, setEnableModalOpen] = useState(false);
  const [disableModalOpen, setDisableModalOpen] = useState(false);
  const [changePinModalOpen, setChangePinModalOpen] = useState(false);
  const [isEnabling, setIsEnabling] = useState(false);
  const [isDisabling, setIsDisabling] = useState(false);
  const [isChangingPin, setIsChangingPin] = useState(false);

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

  function notifyPinSaved() {
    notifications.show({
      title: t("settings.appLock.notifications.pinSaved.title"),
      message: t("settings.appLock.notifications.pinSaved.message"),
      color: "green",
    });
  }

  function notifyPinError(code: string) {
    notifications.show({
      title: t("settings.appLock.notifications.pinSaveFailed.title"),
      message: getPinErrorMessage(code, t),
      color: "red",
    });
  }

  async function handleEnableConfirm(
    pin: string,
    confirmPin: string
  ): Promise<{ ok: boolean; mismatch?: boolean }> {
    setIsEnabling(true);

    try {
      const result = await enableAppLock(pin, confirmPin);

      if (!result.ok && result.reason === "mismatch") {
        return { ok: false, mismatch: true };
      }

      if (!result.ok && result.reason === "error") {
        notifyPinError(result.code);
        return { ok: false };
      }

      setEnableModalOpen(false);
      notifyPinSaved();
      notifySettingsSaved(result.persisted);

      return { ok: true };
    } finally {
      setIsEnabling(false);
    }
  }

  async function handleDisableConfirm(
    pin: string
  ): Promise<{ ok: boolean; invalidPin?: boolean }> {
    setIsDisabling(true);

    try {
      const result = await disableAppLock(pin);

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

      notifications.show(
        result.persisted
          ? {
              title: t("settings.appLock.notifications.disabled.title"),
              message: t(
                "settings.appLock.notifications.disabled.messageWithPin"
              ),
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

  async function handleChangePinConfirm(
    currentPin: string,
    newPin: string,
    confirmPin: string
  ): Promise<{
    ok: boolean;
    mismatch?: boolean;
    invalidPin?: boolean;
    pinError?: string;
  }> {
    setIsChangingPin(true);

    try {
      const result = await changePin(currentPin, newPin, confirmPin);

      if (!result.ok && result.reason === "invalidPin") {
        return { ok: false, invalidPin: true };
      }

      if (!result.ok && result.reason === "mismatch") {
        return { ok: false, mismatch: true };
      }

      if (!result.ok && result.reason === "error") {
        return { ok: false, pinError: result.code };
      }

      notifyPinSaved();
      return { ok: true };
    } finally {
      setIsChangingPin(false);
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
        checked={hasPin}
        onChange={(event) => {
          if (event.currentTarget.checked) {
            setEnableModalOpen(true);
            return;
          }

          setDisableModalOpen(true);
        }}
        color="green"
        mb="md"
      />

      {hasPin ? (
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

          <Button
            variant="light"
            color="green"
            mt="md"
            onClick={() => setChangePinModalOpen(true)}
          >
            {t("settings.appLock.changePin")}
          </Button>
        </>
      ) : null}

      <EnableAppLockModal
        opened={enableModalOpen}
        loading={isEnabling}
        onClose={() => setEnableModalOpen(false)}
        onConfirm={handleEnableConfirm}
      />

      <DisableAppLockModal
        opened={disableModalOpen}
        loading={isDisabling}
        onClose={() => setDisableModalOpen(false)}
        onConfirm={handleDisableConfirm}
      />

      <ChangePinModal
        opened={changePinModalOpen}
        loading={isChangingPin}
        onClose={() => setChangePinModalOpen(false)}
        onConfirm={handleChangePinConfirm}
      />
    </Box>
  );
}
