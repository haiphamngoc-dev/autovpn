import { fetchVpnProfiles, useVpnStatus, type VpnProfile } from "@shared/vpn";
import {
  invalidateVpnSettingsCache,
  loadVpnSettings,
  saveVpnSettings,
} from "@shared/settings/vpn";
import { settingCardStyles } from "@shared/layout";
import { Box, Button, Loader, Radio, Text } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { IconList, IconRefresh } from "@tabler/icons-react";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import styles from "./VpnProfileListCard.module.css";

const ICON_SIZE = 16;
const ICON_STROKE = 1.5;

function resolveSelectedProfile(
  profiles: VpnProfile[],
  savedDefault: string | null
): string | null {
  if (profiles.length === 0) {
    return null;
  }

  if (
    savedDefault &&
    profiles.some((profile) => profile.name === savedDefault)
  ) {
    return savedDefault;
  }

  return profiles[0]?.name ?? null;
}

export function VpnProfileListCard() {
  const { t } = useTranslation();
  const { status: vpnStatus } = useVpnStatus();
  const [profiles, setProfiles] = useState<VpnProfile[]>([]);
  const [selectedProfile, setSelectedProfile] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadProfiles = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    invalidateVpnSettingsCache();

    try {
      const [nextProfiles, vpnSettings] = await Promise.all([
        fetchVpnProfiles(),
        loadVpnSettings(),
      ]);

      setProfiles(nextProfiles);

      const nextSelected = resolveSelectedProfile(
        nextProfiles,
        vpnSettings.defaultProfile
      );
      setSelectedProfile(nextSelected);

      if (
        nextSelected &&
        nextSelected !== vpnSettings.defaultProfile &&
        nextProfiles.length > 0
      ) {
        await saveVpnSettings({ defaultProfile: nextSelected });
      }
    } catch {
      setProfiles([]);
      setSelectedProfile(null);
      setError(t("home.vpnProfiles.loadFailed"));
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      setIsLoading(true);
      setError(null);
      invalidateVpnSettingsCache();

      try {
        const [nextProfiles, vpnSettings] = await Promise.all([
          fetchVpnProfiles(),
          loadVpnSettings(),
        ]);

        if (cancelled) {
          return;
        }

        setProfiles(nextProfiles);

        const nextSelected = resolveSelectedProfile(
          nextProfiles,
          vpnSettings.defaultProfile
        );
        setSelectedProfile(nextSelected);

        if (
          nextSelected &&
          nextSelected !== vpnSettings.defaultProfile &&
          nextProfiles.length > 0
        ) {
          await saveVpnSettings({ defaultProfile: nextSelected });
        }
      } catch {
        if (cancelled) {
          return;
        }

        setProfiles([]);
        setSelectedProfile(null);
        setError(t("home.vpnProfiles.loadFailed"));
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [t, vpnStatus]);

  async function handleProfileChange(value: string) {
    setSelectedProfile(value);
    setIsSaving(true);

    try {
      const { persisted } = await saveVpnSettings({ defaultProfile: value });

      notifications.show(
        persisted
          ? {
              title: t("home.vpnProfiles.notifications.saved.title"),
              message: t("home.vpnProfiles.notifications.saved.message", {
                profile: value,
              }),
              color: "green",
            }
          : {
              title: t("home.vpnProfiles.notifications.saveFailed.title"),
              message: t("home.vpnProfiles.notifications.saveFailed.message"),
              color: "red",
            }
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Box className={settingCardStyles.card}>
      <div className={styles.header}>
        <div className={styles.headerMain}>
          <IconList
            size={ICON_SIZE}
            stroke={ICON_STROKE}
            color="var(--mantine-color-dimmed)"
            aria-hidden
          />
          <div>
            <Text className={settingCardStyles.sectionTitle} mb={4}>
              {t("home.vpnProfiles.title")}
            </Text>
            <Text className={settingCardStyles.cardDescription} mb={0}>
              {t("home.vpnProfiles.description")}
            </Text>
          </div>
        </div>

        <Button
          variant="subtle"
          color="gray"
          size="compact-sm"
          loading={isLoading}
          leftSection={
            <IconRefresh size={ICON_SIZE} stroke={ICON_STROKE} aria-hidden />
          }
          onClick={() => {
            void loadProfiles();
          }}
        >
          {t("home.vpnProfiles.refresh")}
        </Button>
      </div>

      {isLoading && profiles.length === 0 && !error ? (
        <Loader size="sm" color="green" />
      ) : null}

      {error ? <Text className={styles.error}>{error}</Text> : null}

      {!isLoading && !error && profiles.length === 0 ? (
        <Text className={styles.empty}>{t("home.vpnProfiles.empty")}</Text>
      ) : null}

      {!error && profiles.length > 0 && selectedProfile ? (
        <Radio.Group
          value={selectedProfile}
          onChange={(value) => {
            void handleProfileChange(value);
          }}
          name="default-vpn-profile"
        >
          <div className={styles.list}>
            {profiles.map((profile) => (
              <Radio
                key={profile.name}
                value={profile.name}
                disabled={isSaving}
                className={styles.radio}
                classNames={{ label: styles.profileName }}
                label={profile.name}
              />
            ))}
          </div>
        </Radio.Group>
      ) : null}
    </Box>
  );
}
