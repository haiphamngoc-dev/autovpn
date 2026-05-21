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
import styles from "./AppHeader.module.css";

const ICON_SIZE = 22;
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
    >
      {children}
    </button>
  );
}

function ConnectionStatusBadge() {
  const { t } = useTranslation();

  return (
    <span
      className={styles.statusBadge}
      aria-label={t("header.status.disconnected")}
    >
      {t("header.status.disconnected")}
    </span>
  );
}

export function AppHeader() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { hasPin, lock } = useAppLock();
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
    <Box component="header" className={styles.root}>
      <div className={styles.inner}>
        {isSettings ? (
          <>
            <div className={styles.leading}>
              <HeaderIconButton
                label={t("common.back")}
                onClick={() => navigate(paths.home)}
              >
                <IconArrowLeft size={ICON_SIZE} stroke={ICON_STROKE} />
              </HeaderIconButton>
              <Text component="h1" className={styles.settingsTitle}>
                {t("common.settings")}
              </Text>
            </div>
            <div className={styles.actions}>{lockButton}</div>
          </>
        ) : (
          <>
            <div className={styles.brand}>
              <IconShield size={ICON_SIZE} stroke={ICON_STROKE} aria-hidden />
              <Text component="h1" className={styles.brandTitle}>
                {t("app.name")}
              </Text>
            </div>

            <div className={styles.actions}>
              <ConnectionStatusBadge />
              {lockButton}
              <HeaderIconButton
                label={t("common.settings")}
                onClick={() => navigate(paths.settings)}
              >
                <IconSettings size={ICON_SIZE} stroke={ICON_STROKE} />
              </HeaderIconButton>
            </div>
          </>
        )}
      </div>
    </Box>
  );
}
