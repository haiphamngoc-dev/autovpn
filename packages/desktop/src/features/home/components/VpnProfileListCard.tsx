import {
  fetchVpnProfiles,
  useVpnStatus,
  deleteVpnProfile,
  type VpnProfile,
} from "@shared/vpn";
import {
  getProfileConfig,
  invalidateVpnSettingsCache,
  loadVpnSettings,
  saveVpnSettings,
  type VpnProfileConfig,
  type VpnSettings,
} from "@shared/settings/vpn";
import { settingCardStyles } from "@shared/layout";
import {
  Badge,
  Box,
  Button,
  Loader,
  Modal,
  Radio,
  Text,
  Group,
  ActionIcon,
  Stack,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import {
  IconList,
  IconRefresh,
  IconSettings,
  IconPlus,
  IconTrash,
} from "@tabler/icons-react";
import { IconAlertTriangle } from "@tabler/icons-react";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { VpnProfileModal } from "./VpnProfileModal";
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

// Credentials badge helpers
function credentialsBadgeKey(config: VpnProfileConfig | null): string {
  if (!config?.hasCredentials) {
    return "home.vpnProfiles.statusNotConfigured";
  }

  if (config.useTotp) {
    return "home.vpnProfiles.statusTotp";
  }

  return "home.vpnProfiles.statusSaved";
}

// Color coding based on status
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
  const isVpnActive = vpnStatus !== "disconnected";
  const [profiles, setProfiles] = useState<VpnProfile[]>([]);
  const [vpnSettings, setVpnSettings] = useState<VpnSettings | null>(null);
  const [selectedProfile, setSelectedProfile] = useState<string | null>(null);
  const [credentialsProfile, setCredentialsProfile] = useState<string | null>(
    null
  );
  const [importOpened, setImportOpened] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
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

  async function confirmDelete() {
    if (!deleteTarget) return;
    const name = deleteTarget;
    setIsDeleting(true);

    try {
      await deleteVpnProfile(name);
      notifications.show({
        title: t("home.vpnProfiles.notifications.deleted.title"),
        message: t("home.vpnProfiles.notifications.deleted.message", {
          profile: name,
        }),
        color: "green",
      });
      void loadProfiles();
    } catch (err) {
      notifications.show({
        title: t("home.vpnProfiles.notifications.deleteFailed.title"),
        message: t("home.vpnProfiles.notifications.deleteFailed.message", {
          error: String(err),
        }),
        color: "red",
      });
    } finally {
      setIsDeleting(false);
      setDeleteTarget(null);
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
            {isVpnActive ? (
              <Text className={styles.warning} mb={0}>
                {t("home.vpnProfiles.disabledWhileActive")}
              </Text>
            ) : (
              <Text className={settingCardStyles.cardDescription} mb={0}>
                {t("home.vpnProfiles.description")}
              </Text>
            )}
          </div>
        </div>

        <Group gap="xs">
          <Button
            variant="subtle"
            color="blue"
            size="compact-sm"
            disabled={isVpnActive}
            leftSection={
              <IconPlus size={ICON_SIZE} stroke={ICON_STROKE} aria-hidden />
            }
            onClick={() => setImportOpened(true)}
          >
            {t("home.vpnProfiles.import")}
          </Button>
          <Button
            variant="subtle"
            color="gray"
            size="compact-sm"
            loading={isLoading}
            disabled={isVpnActive}
            leftSection={
              <IconRefresh size={ICON_SIZE} stroke={ICON_STROKE} aria-hidden />
            }
            onClick={() => {
              void loadProfiles();
            }}
          >
            {t("home.vpnProfiles.refresh")}
          </Button>
        </Group>
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

              const vpnType = config?.vpnType ?? "openvpn";

              return (
                <div key={profile.name} className={styles.row}>
                  <Radio
                    value={profile.name}
                    disabled={isSaving || isVpnActive}
                    className={styles.radio}
                    aria-label={profile.name}
                  />
                  <div className={styles.rowBody}>
                    <Text className={styles.profileName}>{profile.name}</Text>
                    <Group gap="xs" style={{ display: "inline-flex" }}>
                      <Badge
                        size="sm"
                        variant="outline"
                        color={vpnType === "wireguard" ? "blue" : "orange"}
                      >
                        {vpnType === "wireguard" ? "WireGuard" : "OpenVPN"}
                      </Badge>
                      <Badge
                        size="sm"
                        variant="light"
                        color={credentialsBadgeColor(config)}
                      >
                        {t(credentialsBadgeKey(config))}
                      </Badge>
                    </Group>
                  </div>
                  <Group gap={8}>
                    <Button
                      variant="subtle"
                      color="gray"
                      size="compact-sm"
                      disabled={isVpnActive}
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
                    <ActionIcon
                      variant="subtle"
                      color="red"
                      size="sm"
                      disabled={isVpnActive}
                      onClick={() => setDeleteTarget(profile.name)}
                      title={t("home.vpnProfiles.deleteConfirm.title")}
                    >
                      <IconTrash size={ICON_SIZE} stroke={ICON_STROKE} />
                    </ActionIcon>
                  </Group>
                </div>
              );
            })}
          </div>
        </Radio.Group>
      ) : null}

      <VpnProfileModal
        mode="edit"
        profileName={credentialsProfile}
        opened={credentialsProfile !== null}
        onClose={() => {
          setCredentialsProfile(null);
        }}
        onSaved={() => {
          void loadProfiles();
        }}
      />

      <VpnProfileModal
        mode="import"
        profileName={null}
        opened={importOpened}
        onClose={() => setImportOpened(false)}
        onSaved={() => {
          void loadProfiles();
        }}
      />

      <Modal
        opened={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        title={t("home.vpnProfiles.deleteConfirm.title")}
        size="sm"
        centered
      >
        <Stack gap="md">
          <Group gap="sm" align="flex-start" wrap="nowrap">
            <IconAlertTriangle
              size={24}
              color="var(--mantine-color-red-6)"
              style={{ flexShrink: 0, marginTop: 2 }}
            />
            <Text size="sm">
              {t("home.vpnProfiles.deleteConfirm.message", {
                profile: deleteTarget ?? "",
              })}
            </Text>
          </Group>
          <Group justify="flex-end" gap="sm">
            <Button
              variant="subtle"
              color="gray"
              onClick={() => setDeleteTarget(null)}
              disabled={isDeleting}
            >
              {t("home.vpnProfiles.deleteConfirm.cancel")}
            </Button>
            <Button
              color="red"
              onClick={() => {
                void confirmDelete();
              }}
              loading={isDeleting}
            >
              {t("home.vpnProfiles.deleteConfirm.confirm")}
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Box>
  );
}
