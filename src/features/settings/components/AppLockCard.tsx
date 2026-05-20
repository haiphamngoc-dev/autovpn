import {
  IDLE_TIMEOUT_OPTIONS,
  STORAGE_KEYS,
} from "@features/settings/constants";
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
import { IconLock } from "@tabler/icons-react";
import { useState } from "react";
import styles from "./AppLockCard.module.css";
import { SettingField } from "./SettingField";

function handleLockNow() {
  notifications.show({
    title: "App locked",
    message: "Lock screen will be available in a future update.",
    color: "green",
  });
}

export function AppLockCard() {
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

  function handleRemovePin() {
    setPin("");
    setConfirmPin("");
    notifications.show({
      title: "PIN removed",
      message: "Keyring integration will be available in a future update.",
      color: "green",
    });
  }

  return (
    <Box className={styles.card}>
      <Group gap={6} mb="xs" wrap="nowrap">
        <IconLock size={16} stroke={1.5} color="var(--mantine-color-dimmed)" />
        <Text className={styles.sectionTitle} mb={0}>
          App lock
        </Text>
      </Group>

      <Text className={styles.cardDescription}>
        Like 1Password: locks after inactivity. PIN is stored securely in the
        system keyring.
      </Text>

      <Switch
        label="Lock when idle"
        checked={lockWhenIdle}
        onChange={(event) => setLockWhenIdle(event.currentTarget.checked)}
        color="green"
        mb="md"
      />

      <SettingField label="Idle timeout">
        <Select
          value={idleTimeout}
          onChange={(value) => setIdleTimeout(value ?? "5")}
          data={[...IDLE_TIMEOUT_OPTIONS]}
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
          Lock now
        </Button>
        <Button variant="subtle" color="gray" onClick={handleRemovePin}>
          Remove PIN
        </Button>
      </Group>

      <SettingField label="Change PIN (optional)">
        <PasswordInput
          value={pin}
          onChange={(event) => setPin(event.currentTarget.value)}
          placeholder="Enter new PIN"
        />
      </SettingField>

      <SettingField label="Confirm again">
        <PasswordInput
          value={confirmPin}
          onChange={(event) => setConfirmPin(event.currentTarget.value)}
          placeholder="Confirm new PIN"
        />
      </SettingField>
    </Box>
  );
}
