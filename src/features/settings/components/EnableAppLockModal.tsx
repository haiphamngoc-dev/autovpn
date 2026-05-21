import {
  Button,
  Group,
  Modal,
  PasswordInput,
  Stack,
  Text,
} from "@mantine/core";
import { PinStrengthBar } from "@shared/appLock/PinStrengthBar";
import { useState } from "react";
import { useTranslation } from "react-i18next";

type EnableAppLockModalProps = {
  opened: boolean;
  loading: boolean;
  onClose: () => void;
  onConfirm: (
    pin: string,
    confirmPin: string
  ) => Promise<{ ok: boolean; mismatch?: boolean }>;
};

export function EnableAppLockModal({
  opened,
  loading,
  onClose,
  onConfirm,
}: Readonly<EnableAppLockModalProps>) {
  const { t } = useTranslation();
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleClose() {
    setPin("");
    setConfirmPin("");
    setError(null);
    onClose();
  }

  async function handleConfirm() {
    setError(null);
    const result = await onConfirm(pin, confirmPin);

    if (!result.ok && result.mismatch) {
      setError(t("settings.appLock.notifications.pinMismatch.message"));
      return;
    }

    if (result.ok) {
      handleClose();
    }
  }

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title={t("settings.appLock.enableModal.title")}
      centered
    >
      <Stack gap="md">
        <Text size="sm" c="dimmed">
          {t("settings.appLock.enableModal.description")}
        </Text>

        <Stack gap={6}>
          <PasswordInput
            label={t("settings.appLock.enableModal.pin")}
            value={pin}
            onChange={(event) => {
              setPin(event.currentTarget.value);
              setError(null);
            }}
            placeholder={t("settings.appLock.enableModal.pinPlaceholder")}
            autoFocus
          />
          <PinStrengthBar pin={pin} />
        </Stack>

        <PasswordInput
          label={t("settings.appLock.enableModal.confirmPin")}
          value={confirmPin}
          onChange={(event) => {
            setConfirmPin(event.currentTarget.value);
            setError(null);
          }}
          placeholder={t("settings.appLock.enableModal.confirmPinPlaceholder")}
          error={error}
        />

        <Group justify="flex-end" gap="sm">
          <Button variant="default" onClick={handleClose} disabled={loading}>
            {t("settings.appLock.enableModal.cancel")}
          </Button>
          <Button
            color="green"
            loading={loading}
            disabled={pin.length === 0 || confirmPin.length === 0}
            onClick={() => {
              void handleConfirm();
            }}
          >
            {t("settings.appLock.enableModal.confirm")}
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
