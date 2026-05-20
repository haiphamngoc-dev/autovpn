import { STORAGE_KEYS } from "@features/settings/constants";
import {
  Box,
  Button,
  Group,
  PasswordInput,
  Select,
  Switch,
  Text,
} from "@mantine/core";
import { useLocalStorage } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import { useIdleTimeoutOptions } from "@shared/i18n/options";
import { IconLock } from "@tabler/icons-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import styles from "./AppLockCard.module.css";
import { SettingField } from "./SettingField";

export function AppLockCard() {
  const { t } = useTranslation();
  const idleTimeoutOptions = useIdleTimeoutOptions();
  const [lockWhenIdle, setLockWhenIdle] = useLocalStorage({
    key: STORAGE_KEYS.appLockEnabled,
    defaultValue: true,
  });
  const [idleTimeout, setIdleTimeout] = useLocalStorage({
    key: STORAGE_KEYS.appLockIdleTimeout,
    defaultValue: "5",
  });
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");

  function handleLockNow() {
    notifications.show({
      title: t("settings.appLock.notifications.locked.title"),
      message: t("settings.appLock.notifications.locked.message"),
      color: "green",
    });
  }

  function handleRemovePin() {
    setPin("");
    setConfirmPin("");
    notifications.show({
      title: t("settings.appLock.notifications.pinRemoved.title"),
      message: t("settings.appLock.notifications.pinRemoved.message"),
      color: "green",
    });
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
        label={t("settings.appLock.lockWhenIdle")}
        checked={lockWhenIdle}
        onChange={(event) => setLockWhenIdle(event.currentTarget.checked)}
        color="green"
        mb="md"
      />

      <SettingField label={t("settings.appLock.idleTimeout")}>
        <Select
          value={idleTimeout}
          onChange={(value) => setIdleTimeout(value ?? "5")}
          data={idleTimeoutOptions}
          disabled={!lockWhenIdle}
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
        <Button variant="subtle" color="gray" onClick={handleRemovePin}>
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
    </Box>
  );
}
