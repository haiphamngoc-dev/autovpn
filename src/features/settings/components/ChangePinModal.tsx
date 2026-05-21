import {
  Button,
  Group,
  Modal,
  PasswordInput,
  Stack,
  Text,
} from "@mantine/core";
import { getPinErrorMessage } from "@shared/appLock/pinErrors";
import { PinStrengthBar } from "@shared/appLock/PinStrengthBar";
import { useState } from "react";
import { useTranslation } from "react-i18next";

type ChangePinModalProps = {
  opened: boolean;
  loading: boolean;
  onClose: () => void;
  onConfirm: (
    currentPin: string,
    newPin: string,
    confirmPin: string
  ) => Promise<{
    ok: boolean;
    mismatch?: boolean;
    invalidPin?: boolean;
    pinError?: string;
  }>;
};

export function ChangePinModal({
  opened,
  loading,
  onClose,
  onConfirm,
}: Readonly<ChangePinModalProps>) {
  const { t } = useTranslation();
  const [currentPin, setCurrentPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [currentPinError, setCurrentPinError] = useState<string | null>(null);
  const [newPinError, setNewPinError] = useState<string | null>(null);
  const [confirmPinError, setConfirmPinError] = useState<string | null>(null);

  function clearErrors() {
    setCurrentPinError(null);
    setNewPinError(null);
    setConfirmPinError(null);
  }

  function handleClose() {
    setCurrentPin("");
    setNewPin("");
    setConfirmPin("");
    clearErrors();
    onClose();
  }

  async function handleConfirm() {
    clearErrors();
    const result = await onConfirm(currentPin, newPin, confirmPin);

    if (!result.ok && result.invalidPin) {
      setCurrentPinError(
        t("settings.appLock.changePinModal.invalidCurrentPin")
      );
      return;
    }

    if (!result.ok && result.mismatch) {
      setConfirmPinError(
        t("settings.appLock.notifications.pinMismatch.message")
      );
      return;
    }

    if (!result.ok && result.pinError) {
      setNewPinError(getPinErrorMessage(result.pinError, t));
      return;
    }

    if (result.ok) {
      handleClose();
    }
  }

  const canSubmit =
    currentPin.length > 0 && newPin.length > 0 && confirmPin.length > 0;

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title={t("settings.appLock.changePinModal.title")}
      centered
    >
      <Stack gap="md">
        <Text size="sm" c="dimmed">
          {t("settings.appLock.changePinModal.description")}
        </Text>

        <PasswordInput
          label={t("settings.appLock.changePinModal.currentPin")}
          value={currentPin}
          onChange={(event) => {
            setCurrentPin(event.currentTarget.value);
            setCurrentPinError(null);
          }}
          placeholder={t(
            "settings.appLock.changePinModal.currentPinPlaceholder"
          )}
          error={currentPinError}
          autoFocus
        />

        <Stack gap={6}>
          <PasswordInput
            label={t("settings.appLock.changePinModal.newPin")}
            value={newPin}
            onChange={(event) => {
              setNewPin(event.currentTarget.value);
              setNewPinError(null);
            }}
            placeholder={t("settings.appLock.changePinModal.newPinPlaceholder")}
            error={newPinError}
          />
          <PinStrengthBar pin={newPin} />
        </Stack>

        <PasswordInput
          label={t("settings.appLock.changePinModal.confirmPin")}
          value={confirmPin}
          onChange={(event) => {
            setConfirmPin(event.currentTarget.value);
            setConfirmPinError(null);
          }}
          placeholder={t(
            "settings.appLock.changePinModal.confirmPinPlaceholder"
          )}
          error={confirmPinError}
        />

        <Group justify="flex-end" gap="sm">
          <Button variant="default" onClick={handleClose} disabled={loading}>
            {t("settings.appLock.changePinModal.cancel")}
          </Button>
          <Button
            color="green"
            loading={loading}
            disabled={!canSubmit}
            onClick={() => {
              void handleConfirm();
            }}
          >
            {t("settings.appLock.changePinModal.confirm")}
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
