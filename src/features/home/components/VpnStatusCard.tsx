import { Box, Button, Text, Group } from "@mantine/core";
import {
  ConnectionStatusBadge,
  useVpnStatus,
  type VpnConnectionStatus,
} from "@shared/vpn";
import {
  getProfileConfig,
  isProfileReadyForConnect,
  loadVpnSettings,
  type VpnSettings,
} from "@shared/settings/vpn";
import { settingCardStyles } from "@shared/layout";
import {
  IconPlugConnected,
  IconPlugConnectedX,
  IconShield,
  IconShieldCheck,
  IconRefresh,
} from "@tabler/icons-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import styles from "./VpnStatusCard.module.css";

const HEADER_ICON_SIZE = 16;
const ACTION_ICON_SIZE = 16;
const ICON_STROKE = 1.5;

type ActionPlacement = "inline" | "bottom";

const DESCRIPTION_KEY: Record<VpnConnectionStatus, string> = {
  connected: "home.vpnStatus.descriptionConnected",
  connecting: "home.vpnStatus.descriptionConnecting",
  disconnected: "home.vpnStatus.descriptionDisconnected",
};

const HEADER_ICON = {
  connected: IconShieldCheck,
  connecting: IconShield,
  disconnected: IconShield,
} as const;

export function VpnStatusCard() {
  const { t } = useTranslation();
  const { status, connect, disconnect, reconnect, isBusy } = useVpnStatus();
  const [vpnSettings, setVpnSettings] = useState<VpnSettings | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);

  useEffect(() => {
    void loadVpnSettings().then(setVpnSettings);
  }, [status]);

  const defaultProfile = vpnSettings?.defaultProfile ?? null;
  const profileConfig = vpnSettings
    ? getProfileConfig(vpnSettings, defaultProfile ?? "")
    : null;
  const isConnected = status === "connected";
  const isConnectPending = isBusy || status === "connecting";
  const isDisconnectPending = isBusy || status === "connecting";
  const hasDefaultProfile = Boolean(defaultProfile);
  const hasCredentials = isProfileReadyForConnect(
    vpnSettings ?? {
      defaultProfile: null,
      profileConfigs: {},
      autoConnect: false,
      autoReconnect: { enabled: false, maxAttempts: 3 },
    },
    defaultProfile
  );
  const canConnect = hasDefaultProfile && hasCredentials;
  const HeaderIcon = HEADER_ICON[status];
  const descriptionKey = DESCRIPTION_KEY[status];

  function handleConnect() {
    connect().catch(() => undefined);
  }

  function handleDisconnect() {
    disconnect().catch(() => undefined);
  }

  function handleCancel() {
    setIsCancelling(true);
    disconnect()
      .catch(() => undefined)
      .finally(() => setIsCancelling(false));
  }

  function handleReconnect() {
    reconnect().catch(() => undefined);
  }

  function renderDescription() {
    if (!hasDefaultProfile) {
      return t("home.vpnStatus.noDefaultProfile");
    }

    if (!hasCredentials) {
      return t("home.vpnStatus.noCredentials", { profile: defaultProfile });
    }

    if (profileConfig?.useTotp && !isConnected) {
      return t("home.vpnStatus.usesTotp");
    }

    return t(descriptionKey, { profile: defaultProfile });
  }

  function renderAction(placement: ActionPlacement) {
    const isBottom = placement === "bottom";

    if (isConnected) {
      return (
        <Group gap="xs" grow={isBottom} wrap={isBottom ? undefined : "nowrap"}>
          <Button
            size={isBottom ? "sm" : "compact-sm"}
            fullWidth={isBottom}
            color="red"
            variant="filled"
            loading={isDisconnectPending}
            disabled={isDisconnectPending || isConnectPending}
            leftSection={
              <IconPlugConnectedX
                size={ACTION_ICON_SIZE}
                stroke={ICON_STROKE}
                aria-hidden
              />
            }
            onClick={handleDisconnect}
          >
            {t("home.vpnStatus.disconnect")}
          </Button>
          <Button
            size={isBottom ? "sm" : "compact-sm"}
            fullWidth={isBottom}
            color="blue"
            variant="light"
            loading={isConnectPending}
            disabled={isDisconnectPending || isConnectPending}
            leftSection={
              <IconRefresh
                size={ACTION_ICON_SIZE}
                stroke={ICON_STROKE}
                aria-hidden
              />
            }
            onClick={handleReconnect}
          >
            {t("home.vpnStatus.reconnect")}
          </Button>
        </Group>
      );
    }

    if (status === "connecting") {
      return (
        <Button
          size={isBottom ? "sm" : "compact-sm"}
          fullWidth={isBottom}
          color="red"
          variant="filled"
          loading={isCancelling}
          leftSection={
            <IconPlugConnectedX
              size={ACTION_ICON_SIZE}
              stroke={ICON_STROKE}
              aria-hidden
            />
          }
          onClick={handleCancel}
        >
          {t("home.vpnStatus.cancel")}
        </Button>
      );
    }

    return (
      <Button
        size={isBottom ? "sm" : "compact-sm"}
        fullWidth={isBottom}
        color="green"
        variant="filled"
        loading={isConnectPending}
        disabled={!canConnect || isConnectPending}
        leftSection={
          <IconPlugConnected
            size={ACTION_ICON_SIZE}
            stroke={ICON_STROKE}
            aria-hidden
          />
        }
        onClick={handleConnect}
      >
        {t("home.vpnStatus.connect")}
      </Button>
    );
  }

  return (
    <Box
      className={`${settingCardStyles.card} ${
        isConnected ? styles.cardConnected : ""
      }`}
    >
      <div className={styles.layout}>
        <HeaderIcon
          size={HEADER_ICON_SIZE}
          stroke={ICON_STROKE}
          color="var(--mantine-color-dimmed)"
          aria-hidden
        />

        <div className={styles.body}>
          <div className={styles.topRow}>
            <div className={styles.titleGroup}>
              <Text className={settingCardStyles.sectionTitle} mb={0}>
                {t("home.vpnStatus.title")}
              </Text>
              <ConnectionStatusBadge status={status} />
            </div>

            <div className={styles.actionInline}>{renderAction("inline")}</div>
          </div>

          <Text className={styles.description}>{renderDescription()}</Text>
        </div>
      </div>

      <div className={styles.actionBottom}>{renderAction("bottom")}</div>
    </Box>
  );
}
