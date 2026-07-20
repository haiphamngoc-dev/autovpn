import { Box, Button, PasswordInput, Stack, Text } from "@mantine/core";
import { IconLock } from "@tabler/icons-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useAppLock } from "./useAppLock";
import { useWindowBehavior } from "@shared/windowBehavior";
import { useWindowControls } from "@shared/hooks";
import { WindowControls } from "@shared/components/WindowTitleBar";
import styles from "./AppLockOverlay.module.css";

export function AppLockOverlay() {
  const { t } = useTranslation();
  const { hasPin, isLocked, unlock } = useAppLock();
  const { showCustomTitleBar } = useWindowBehavior();
  const { startDrag, toggleMaximize } = useWindowControls();
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isMac =
    typeof window !== "undefined" && navigator.userAgent.includes("Mac");

  if (!hasPin || !isLocked) {
    return null;
  }

  async function handleUnlock() {
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

  return (
    <Box className={styles.overlay} role="dialog" aria-modal="true">
      {/* If custom titlebar is active, render a simplified TitleBar on top of the lock screen */}
      {showCustomTitleBar && (
        <Box
          className={styles.titlebar}
          data-tauri-drag-region
          onMouseDown={startDrag}
          onDoubleClick={toggleMaximize}
        >
          <div className={styles.titlebarInner} data-tauri-drag-region>
            {isMac ? (
              <WindowControls />
            ) : (
              <div className={styles.windowsControlsWrapper}>
                <WindowControls />
              </div>
            )}
          </div>
        </Box>
      )}

      <Box className={styles.card}>
        <Stack gap="sm" align="center" style={{ textAlign: "center" }}>
          <div className={styles.lockIconWrapper}>
            <IconLock
              size={24}
              stroke={1.5}
              color="var(--mantine-color-emerald-6)"
            />
          </div>
          <Text className={styles.title}>{t("appLock.overlay.title")}</Text>
          <Text className={styles.description}>
            {t("appLock.overlay.descriptionWithPin")}
          </Text>

          <Box
            component="form"
            onSubmit={(event) => {
              event.preventDefault();
              void handleUnlock();
            }}
            className={styles.form}
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
              w="100%"
            />

            {error ? <Text className={styles.error}>{error}</Text> : null}

            <Button
              type="submit"
              fullWidth
              color="emerald"
              loading={isSubmitting}
              disabled={pin.length === 0}
            >
              {t("appLock.overlay.unlock")}
            </Button>
          </Box>
        </Stack>
      </Box>
    </Box>
  );
}
