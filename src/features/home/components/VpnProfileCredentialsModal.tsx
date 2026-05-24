import { SettingField } from "@features/settings/components/SettingField";
import {
  fetchVpnProfileCredentials,
  removeVpnProfileCredentials,
  saveVpnProfileCredentials,
} from "@shared/settings/vpn";
import {
  Button,
  Group,
  Modal,
  PasswordInput,
  Stack,
  Switch,
  Text,
  TextInput,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

type VpnProfileCredentialsModalProps = Readonly<{
  profileName: string | null;
  opened: boolean;
  onClose: () => void;
  onSaved: () => void;
}>;

export function VpnProfileCredentialsModal({
  profileName,
  opened,
  onClose,
  onSaved,
}: VpnProfileCredentialsModalProps) {
  const { t } = useTranslation();
  const [username, setUsername] = useState("");
  const [basePassword, setBasePassword] = useState("");
  const [useTotp, setUseTotp] = useState(false);
  const [totpSecret, setTotpSecret] = useState("");
  const [hasBasePassword, setHasBasePassword] = useState(false);
  const [hasTotpSecret, setHasTotpSecret] = useState(false);
  const [hasStoredCredentials, setHasStoredCredentials] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!opened || !profileName) {
      return;
    }

    let cancelled = false;

    void (async () => {
      setIsLoading(true);
      setError(null);

      try {
        const view = await fetchVpnProfileCredentials(profileName);

        if (cancelled) {
          return;
        }

        setUsername(view.username);
        setUseTotp(view.useTotp);
        setHasBasePassword(view.hasBasePassword);
        setHasTotpSecret(view.hasTotpSecret);
        setHasStoredCredentials(view.hasBasePassword || view.hasTotpSecret);
        setBasePassword(view.basePassword);
        setTotpSecret(view.totpSecret);
      } catch {
        if (!cancelled) {
          setError(t("home.vpnCredentials.loadFailed"));
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [opened, profileName, t]);

  function resetForm() {
    setUsername("");
    setBasePassword("");
    setUseTotp(false);
    setTotpSecret("");
    setHasBasePassword(false);
    setHasTotpSecret(false);
    setHasStoredCredentials(false);
    setError(null);
  }

  function handleClose() {
    resetForm();
    onClose();
  }

  async function handleSave() {
    if (!profileName) {
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      await saveVpnProfileCredentials({
        profileName,
        useTotp,
        basePassword: basePassword || undefined,
        totpSecret: totpSecret || undefined,
      });

      notifications.show({
        title: t("home.vpnCredentials.notifications.saved.title"),
        message: t("home.vpnCredentials.notifications.saved.message", {
          profile: profileName,
        }),
        color: "green",
      });

      onSaved();
      handleClose();
    } catch {
      setError(t("home.vpnCredentials.saveFailed"));
    } finally {
      setIsSaving(false);
    }
  }

  async function handleRemove() {
    if (!profileName) {
      return;
    }

    setIsRemoving(true);
    setError(null);

    try {
      await removeVpnProfileCredentials(profileName);

      notifications.show({
        title: t("home.vpnCredentials.notifications.removed.title"),
        message: t("home.vpnCredentials.notifications.removed.message", {
          profile: profileName,
        }),
        color: "green",
      });

      onSaved();
      handleClose();
    } catch {
      setError(t("home.vpnCredentials.removeFailed"));
    } finally {
      setIsRemoving(false);
    }
  }

  const basePasswordPlaceholder = hasBasePassword
    ? t("home.vpnCredentials.basePasswordPlaceholderKeep")
    : t("home.vpnCredentials.basePasswordPlaceholder");

  const totpSecretPlaceholder = hasTotpSecret
    ? t("home.vpnCredentials.totpSecretPlaceholderKeep")
    : t("home.vpnCredentials.totpSecretPlaceholder");

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title={
        profileName
          ? t("home.vpnCredentials.title", { profile: profileName })
          : t("home.vpnCredentials.titleFallback")
      }
      centered
      size="md"
    >
      <Stack gap="md">
        <Text size="sm" c="dimmed">
          {t("home.vpnCredentials.description")}
        </Text>

        {error ? (
          <Text size="sm" c="red">
            {error}
          </Text>
        ) : null}

        <SettingField
          label={t("home.vpnCredentials.username")}
          description={t("home.vpnCredentials.usernameHelp")}
        >
          <TextInput
            value={username}
            placeholder={t("home.vpnCredentials.noUsernameDetected")}
            disabled
            readOnly
          />
        </SettingField>

        <SettingField
          label={t("home.vpnCredentials.basePassword")}
          description={t("home.vpnCredentials.basePasswordHelp")}
        >
          <PasswordInput
            value={basePassword}
            onChange={(event) => {
              setBasePassword(event.currentTarget.value);
              setError(null);
            }}
            placeholder={basePasswordPlaceholder}
            disabled={isLoading || isSaving || isRemoving}
          />
        </SettingField>

        <Switch
          label={t("home.vpnCredentials.useTotp")}
          description={t("home.vpnCredentials.useTotpHelp")}
          checked={useTotp}
          onChange={(event) => {
            setUseTotp(event.currentTarget.checked);
            setError(null);
          }}
          disabled={isLoading || isSaving || isRemoving}
        />

        {useTotp ? (
          <SettingField
            label={t("home.vpnCredentials.totpSecret")}
            description={t("home.vpnCredentials.totpSecretHelp")}
          >
            <PasswordInput
              value={totpSecret}
              onChange={(event) => {
                setTotpSecret(event.currentTarget.value);
                setError(null);
              }}
              placeholder={totpSecretPlaceholder}
              disabled={isLoading || isSaving || isRemoving}
            />
          </SettingField>
        ) : null}

        <Group justify="space-between" gap="sm" wrap="wrap">
          <Button
            variant="light"
            color="red"
            disabled={
              isLoading || isSaving || isRemoving || !hasStoredCredentials
            }
            loading={isRemoving}
            onClick={() => {
              void handleRemove();
            }}
          >
            {t("home.vpnCredentials.remove")}
          </Button>

          <Group gap="sm" wrap="nowrap">
            <Button
              variant="default"
              onClick={handleClose}
              disabled={isSaving || isRemoving}
            >
              {t("home.vpnCredentials.cancel")}
            </Button>
            <Button
              color="green"
              loading={isSaving || isLoading}
              disabled={!username.trim()}
              onClick={() => {
                void handleSave();
              }}
            >
              {t("home.vpnCredentials.save")}
            </Button>
          </Group>
        </Group>
      </Stack>
    </Modal>
  );
}
