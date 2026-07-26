import {
  Button,
  Group,
  Modal,
  PasswordInput,
  Stack,
  Text,
} from "@mantine/core";
import { useState } from "react";
import { useTranslation } from "react-i18next";

type DisableAppLockModalProps = {
  opened: boolean;
  loading: boolean;
  onClose: () => void;
  onConfirm: (pin: string) => Promise<{ ok: boolean; invalidPin?: boolean }>;
};

export function DisableAppLockModal({
  opened,
  loading,
  onClose,
  onConfirm,
}: Readonly<DisableAppLockModalProps>) {
  const { t } = useTranslation();
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleClose() {
    setPin("");
    setError(null);
    onClose();
  }

  async function handleConfirm() {
    setError(null);
    const result = await onConfirm(pin);

    if (!result.ok && result.invalidPin) {
      setError(t("settings.appLock.disableModal.invalidPin"));
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
      title={t("settings.appLock.disableModal.title")}
      centered
    >
      <Stack gap="md">
        <Text size="sm" c="dimmed">
          {t("settings.appLock.disableModal.description")}
        </Text>

        <PasswordInput
          value={pin}
          onChange={(event) => {
            setPin(event.currentTarget.value);
            setError(null);
          }}
          placeholder={t("settings.appLock.disableModal.pinPlaceholder")}
          error={error}
          autoFocus
        />

        <Group justify="flex-end" gap="sm">
          <Button variant="default" onClick={handleClose} disabled={loading}>
            {t("settings.appLock.disableModal.cancel")}
          </Button>
          <Button
            color="red"
            loading={loading}
            disabled={pin.length === 0}
            onClick={() => {
              void handleConfirm();
            }}
          >
            {t("settings.appLock.disableModal.confirm")}
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
