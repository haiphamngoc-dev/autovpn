import { fetchVpnProfiles, useVpnStatus, type VpnProfile } from "@shared/vpn";
import {
  getProfileConfig,
  invalidateVpnSettingsCache,
  loadVpnSettings,
  saveVpnSettings,
  type VpnProfileConfig,
  type VpnSettings,
} from "@shared/settings/vpn";
import { settingCardStyles } from "@shared/layout";
import { Badge, Box, Button, Loader, Radio, Text } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { IconList, IconRefresh, IconSettings } from "@tabler/icons-react";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { VpnProfileCredentialsModal } from "./VpnProfileCredentialsModal";
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

function credentialsBadgeKey(config: VpnProfileConfig | null): string {
  if (!config?.hasCredentials) {
    return "home.vpnProfiles.statusNotConfigured";
  }

  if (config.useTotp) {
    return "home.vpnProfiles.statusTotp";
  }

  return "home.vpnProfiles.statusSaved";
}

function credentialsBadgeColor(
  config: VpnProfileConfig | null
): "gray" | "green" | "teal" {
  if (!config?.hasCredentials) {
    return "gray";
  }

  if (config.useTotp) {
    return "teal";
  }

  return "green";
}

export function VpnProfileListCard() {
  const { t } = useTranslation();
  const { status: vpnStatus } = useVpnStatus();
  const [profiles, setProfiles] = useState<VpnProfile[]>([]);
  const [vpnSettings, setVpnSettings] = useState<VpnSettings | null>(null);
  const [selectedProfile, setSelectedProfile] = useState<string | null>(null);
  const [credentialsProfile, setCredentialsProfile] = useState<string | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadProfiles = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    invalidateVpnSettingsCache();

    try {
      const [nextProfiles, nextSettings] = await Promise.all([
        fetchVpnProfiles(),
        loadVpnSettings(),
      ]);

      setProfiles(nextProfiles);
      setVpnSettings(nextSettings);

      const nextSelected = resolveSelectedProfile(
        nextProfiles,
        nextSettings.defaultProfile
      );
      setSelectedProfile(nextSelected);

      if (
        nextSelected &&
        nextSelected !== nextSettings.defaultProfile &&
        nextProfiles.length > 0
      ) {
        const { settings: saved } = await saveVpnSettings({
          defaultProfile: nextSelected,
        });
        setVpnSettings(saved);
      }
    } catch {
      setProfiles([]);
      setVpnSettings(null);
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
        const [nextProfiles, nextSettings] = await Promise.all([
          fetchVpnProfiles(),
          loadVpnSettings(),
        ]);

        if (cancelled) {
          return;
        }

        setProfiles(nextProfiles);
        setVpnSettings(nextSettings);

        const nextSelected = resolveSelectedProfile(
          nextProfiles,
          nextSettings.defaultProfile
        );
        setSelectedProfile(nextSelected);

        if (
          nextSelected &&
          nextSelected !== nextSettings.defaultProfile &&
          nextProfiles.length > 0
        ) {
          const { settings: saved } = await saveVpnSettings({
            defaultProfile: nextSelected,
          });
          setVpnSettings(saved);
        }
      } catch {
        if (cancelled) {
          return;
        }

        setProfiles([]);
        setVpnSettings(null);
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
      const { settings: saved, persisted } = await saveVpnSettings({
        defaultProfile: value,
      });
      setVpnSettings(saved);

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
            {profiles.map((profile) => {
              const config = vpnSettings
                ? getProfileConfig(vpnSettings, profile.name)
                : null;

              return (
                <div key={profile.name} className={styles.row}>
                  <Radio
                    value={profile.name}
                    disabled={isSaving}
                    className={styles.radio}
                    aria-label={profile.name}
                  />
                  <div className={styles.rowBody}>
                    <Text className={styles.profileName}>{profile.name}</Text>
                    <Badge
                      size="sm"
                      variant="light"
                      color={credentialsBadgeColor(config)}
                    >
                      {t(credentialsBadgeKey(config))}
                    </Badge>
                  </div>
                  <Button
                    variant="subtle"
                    color="gray"
                    size="compact-sm"
                    leftSection={
                      <IconSettings
                        size={ICON_SIZE}
                        stroke={ICON_STROKE}
                        aria-hidden
                      />
                    }
                    onClick={() => {
                      setCredentialsProfile(profile.name);
                    }}
                  >
                    {t("home.vpnProfiles.configure")}
                  </Button>
                </div>
              );
            })}
          </div>
        </Radio.Group>
      ) : null}

      <VpnProfileCredentialsModal
        profileName={credentialsProfile}
        opened={credentialsProfile !== null}
        onClose={() => {
          setCredentialsProfile(null);
        }}
        onSaved={() => {
          void loadProfiles();
        }}
      />
    </Box>
  );
}
