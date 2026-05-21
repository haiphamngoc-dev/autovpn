import { useTranslation } from "react-i18next";
import type { VpnConnectionStatus } from "./types";
import styles from "./ConnectionStatusBadge.module.css";

type ConnectionStatusBadgeProps = {
  status: VpnConnectionStatus;
};

const STATUS_CLASS: Record<VpnConnectionStatus, string> = {
  disconnected: styles.disconnected,
  connecting: styles.connecting,
  connected: styles.connected,
};

export function ConnectionStatusBadge({
  status,
}: Readonly<ConnectionStatusBadgeProps>) {
  const { t } = useTranslation();
  const label = t(`header.status.${status}`);

  return (
    <span
      className={`${styles.badge} ${STATUS_CLASS[status]}`}
      aria-label={label}
    >
      {label}
    </span>
  );
}
