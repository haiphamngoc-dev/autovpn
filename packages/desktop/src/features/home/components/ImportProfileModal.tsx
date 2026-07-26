import {
  Button,
  Group,
  Modal,
  Select,
  Stack,
  Text,
  TextInput,
  FileButton,
  Box,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { IconFileCode, IconUpload } from "@tabler/icons-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { importVpnProfile } from "@shared/vpn";

type ImportProfileModalProps = Readonly<{
  opened: boolean;
  onClose: () => void;
  onImported: () => void;
}>;

export function ImportProfileModal({
  opened,
  onClose,
  onImported,
}: ImportProfileModalProps) {
  const { t } = useTranslation();
  const [profileName, setProfileName] = useState("");
  const [vpnType, setVpnType] = useState<string>("openvpn");
  const [configContent, setConfigContent] = useState("");
  const [fileName, setFileName] = useState("");
  const [username, setUsername] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = async (file: File | null) => {
    if (!file) return;

    setError(null);
    setFileName(file.name);

    // Auto-suggest profile name from filename (strip extension)
    const extIdx = file.name.lastIndexOf(".");
    const suggestedName =
      extIdx > 0 ? file.name.substring(0, extIdx) : file.name;
    setProfileName(suggestedName);

    // Auto-detect VPN type from file extension
    const extension = file.name.substring(extIdx + 1).toLowerCase();
    if (extension === "conf") {
      setVpnType("wireguard");
    } else {
      setVpnType("openvpn");
    }

    // Read file contents as text
    try {
      const text = await file.text();
      setConfigContent(text);
    } catch (err) {
      setError(
        t("home.vpnProfiles.notifications.importFailed.message", {
          error: String(err),
        })
      );
    }
  };

  const handleClose = () => {
    setProfileName("");
    setVpnType("openvpn");
    setConfigContent("");
    setFileName("");
    setUsername("");
    setError(null);
    onClose();
  };

  const handleSubmit = async () => {
    const trimmedProfileName = profileName.trim();
    if (!trimmedProfileName) {
      setError(t("home.vpnProfiles.importModal.profileName"));
      return;
    }

    if (!configContent.trim()) {
      setError(t("home.vpnProfiles.importModal.fileLabel"));
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      await importVpnProfile(
        trimmedProfileName,
        vpnType,
        configContent,
        username.trim()
      );

      notifications.show({
        title: t("home.vpnProfiles.notifications.imported.title"),
        message: t("home.vpnProfiles.notifications.imported.message", {
          profile: trimmedProfileName,
        }),
        color: "green",
      });

      onImported();
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title={t("home.vpnProfiles.importModal.title")}
      size="md"
    >
      <Stack gap="md">
        {error && (
          <Text c="red" size="sm">
            {error}
          </Text>
        )}

        <Box>
          <Text size="sm" fw={500} mb={4}>
            {t("home.vpnProfiles.importModal.fileLabel")}
          </Text>
          <Group align="center">
            <FileButton onChange={handleFileChange} accept=".ovpn,.conf">
              {(props) => (
                <Button
                  {...props}
                  variant="light"
                  color="blue"
                  leftSection={<IconUpload size={16} />}
                >
                  {t("home.vpnProfiles.importModal.fileLabel")}
                </Button>
              )}
            </FileButton>
            {fileName && (
              <Group gap={4}>
                <IconFileCode size={16} color="gray" />
                <Text size="sm" c="dimmed">
                  {fileName}
                </Text>
              </Group>
            )}
          </Group>
          <Text size="xs" c="dimmed" mt={4}>
            {t("home.vpnProfiles.importModal.fileHelp")}
          </Text>
        </Box>

        <TextInput
          label={t("home.vpnProfiles.importModal.profileName")}
          placeholder="e.g. My Company VPN"
          value={profileName}
          onChange={(e) => setProfileName(e.currentTarget.value)}
          required
        />

        <Select
          label={t("home.vpnProfiles.importModal.vpnType")}
          value={vpnType}
          onChange={(value) => setVpnType(value ?? "openvpn")}
          data={[
            { value: "openvpn", label: "OpenVPN (.ovpn)" },
            { value: "wireguard", label: "WireGuard (.conf)" },
          ]}
          required
        />

        {vpnType === "openvpn" && (
          <TextInput
            label={t("home.vpnProfiles.importModal.username")}
            placeholder="e.g. employee1"
            value={username}
            onChange={(e) => setUsername(e.currentTarget.value)}
            description={t("home.vpnProfiles.importModal.credentialsHint")}
          />
        )}

        <Group justify="flex-end" mt="xl">
          <Button
            variant="subtle"
            color="gray"
            onClick={handleClose}
            disabled={isSaving}
          >
            {t("home.vpnProfiles.importModal.cancel")}
          </Button>
          <Button
            onClick={handleSubmit}
            loading={isSaving}
            disabled={!configContent}
          >
            {t("home.vpnProfiles.importModal.submit")}
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
