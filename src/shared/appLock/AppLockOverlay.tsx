import { Box, Button, PasswordInput, Stack, Text } from "@mantine/core";
import { IconLock } from "@tabler/icons-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useAppLock } from "./useAppLock";
import styles from "./AppLockOverlay.module.css";

export function AppLockOverlay() {
  const { t } = useTranslation();
  const { settings, isLocked, hasPin, unlock } = useAppLock();
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!settings.enabled || !isLocked) {
    return null;
  }

  async function handleUnlockWithPin() {
    setError(null);
    setIsSubmitting(true);

    try {
      const verified = await unlock(pin);

      if (verified) {
        setPin("");
        return;
      }

      setError(t("appLock.overlay.invalidPin"));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleUnlockWithoutPin() {
    setIsSubmitting(true);

    try {
      await unlock("");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Box className={styles.overlay} role="dialog" aria-modal="true">
      <Box className={styles.card}>
        <Stack gap="sm">
          <IconLock
            size={28}
            stroke={1.5}
            color="var(--mantine-color-green-6)"
          />
          <Text className={styles.title}>{t("appLock.overlay.title")}</Text>
          <Text className={styles.description}>
            {hasPin
              ? t("appLock.overlay.descriptionWithPin")
              : t("appLock.overlay.descriptionWithoutPin")}
          </Text>

          {hasPin ? (
            <Box
              component="form"
              onSubmit={(event) => {
                event.preventDefault();
                void handleUnlockWithPin();
              }}
            >
              <PasswordInput
                value={pin}
                onChange={(event) => {
                  setPin(event.currentTarget.value);
                  setError(null);
                }}
                placeholder={t("appLock.overlay.pinPlaceholder")}
                autoFocus
                mb="sm"
              />

              {error ? <Text className={styles.error}>{error}</Text> : null}

              <Button
                type="submit"
                fullWidth
                color="green"
                loading={isSubmitting}
                disabled={pin.length === 0}
              >
                {t("appLock.overlay.unlock")}
              </Button>
            </Box>
          ) : (
            <Button
              fullWidth
              color="green"
              loading={isSubmitting}
              onClick={() => {
                void handleUnlockWithoutPin();
              }}
            >
              {t("appLock.overlay.unlock")}
            </Button>
          )}
        </Stack>
      </Box>
    </Box>
  );
}
