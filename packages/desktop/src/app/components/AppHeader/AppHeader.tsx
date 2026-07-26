import { Box, Text } from "@mantine/core";
import type { ReactNode } from "react";
import { notifications } from "@mantine/notifications";
import { useAppLock } from "@shared/appLock";
import {
  IconArrowLeft,
  IconLock,
  IconSettings,
  IconShield,
} from "@tabler/icons-react";
import { paths } from "@app/routers/paths";
import { useTranslation } from "react-i18next";
import { useLocation, useNavigate } from "react-router-dom";
import { useWindowControls } from "@shared/hooks";
import { useWindowBehavior } from "@shared/windowBehavior";
import { WindowControls } from "@shared/components/WindowTitleBar";
import styles from "./AppHeader.module.css";

const ICON_SIZE = 20;
const ICON_STROKE = 1.5;

type HeaderIconButtonProps = {
  label: string;
  onClick: () => void;
  children: ReactNode;
};

function HeaderIconButton({
  label,
  onClick,
  children,
}: Readonly<HeaderIconButtonProps>) {
  return (
    <button
      type="button"
      className={styles.iconButton}
      aria-label={label}
      title={label}
      onClick={onClick}
      data-no-drag
    >
      {children}
    </button>
  );
}

export function AppHeader() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { hasPin, lock } = useAppLock();
  const { showCustomTitleBar } = useWindowBehavior();
  const { startDrag, toggleMaximize } = useWindowControls();
  const isMac =
    typeof window !== "undefined" && navigator.userAgent.includes("Mac");

  const isSettings = location.pathname === paths.settings;

  function handleLockNow() {
    lock();

    notifications.show({
      title: t("settings.appLock.notifications.locked.title"),
      message: t("settings.appLock.notifications.locked.messageWithPin"),
      color: "green",
    });
  }

  const lockButton = hasPin ? (
    <HeaderIconButton label={t("common.lock")} onClick={handleLockNow}>
      <IconLock size={ICON_SIZE} stroke={ICON_STROKE} />
    </HeaderIconButton>
  ) : null;

  return (
    <Box
      component="header"
      className={`${styles.root} ${showCustomTitleBar ? styles.customHeader : ""}`}
      data-tauri-drag-region={showCustomTitleBar || undefined}
      onMouseDown={showCustomTitleBar ? startDrag : undefined}
      onDoubleClick={showCustomTitleBar ? toggleMaximize : undefined}
    >
      <div
        className={styles.inner}
        data-tauri-drag-region={showCustomTitleBar || undefined}
      >
        {/* If custom titlebar is active and it's macOS, render Traffic Lights controls at the far left */}
        {showCustomTitleBar && isMac && <WindowControls />}

        {isSettings ? (
          <div
            className={styles.leading}
            data-tauri-drag-region={showCustomTitleBar || undefined}
          >
            <HeaderIconButton
              label={t("common.back")}
              onClick={() => navigate(paths.home)}
            >
              <IconArrowLeft size={ICON_SIZE} stroke={ICON_STROKE} />
            </HeaderIconButton>
            <Text
              component="h1"
              className={styles.settingsTitle}
              data-tauri-drag-region={showCustomTitleBar || undefined}
            >
              {t("common.settings")}
            </Text>
          </div>
        ) : (
          <div
            className={styles.brand}
            data-tauri-drag-region={showCustomTitleBar || undefined}
            style={{
              paddingLeft: showCustomTitleBar && isMac ? "4px" : undefined,
            }}
          >
            <IconShield
              size={ICON_SIZE}
              stroke={ICON_STROKE}
              aria-hidden
              data-tauri-drag-region={showCustomTitleBar || undefined}
            />
            <Text
              component="h1"
              className={styles.brandTitle}
              data-tauri-drag-region={showCustomTitleBar || undefined}
            >
              {t("app.name")}
            </Text>
          </div>
        )}

        <div
          className={styles.actions}
          data-tauri-drag-region={showCustomTitleBar || undefined}
        >
          {lockButton}
          {!isSettings && (
            <HeaderIconButton
              label={t("common.settings")}
              onClick={() => navigate(paths.settings)}
            >
              <IconSettings size={ICON_SIZE} stroke={ICON_STROKE} />
            </HeaderIconButton>
          )}

          {/* If custom titlebar is active and it's NOT macOS (Windows/Linux), render Windows controls at the far right */}
          {showCustomTitleBar && !isMac && <WindowControls />}
        </div>
      </div>
    </Box>
  );
}
