import { SettingField } from "@features/settings/components/SettingField";
import {
  fetchVpnProfileCredentials,
  removeVpnProfileCredentials,
  saveVpnProfileCredentials,
  type PasswordPart,
} from "@shared/settings/vpn";
import { importVpnProfile } from "@shared/vpn";
import {
  Button,
  Group,
  Modal,
  PasswordInput,
  Stack,
  Text,
  TextInput,
  Box,
  Card,
  ActionIcon,
  Menu,
  FileButton,
  Select,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  IconPlus,
  IconTrash,
  IconArrowUp,
  IconArrowDown,
  IconAlignLeft,
  IconDeviceMobile,
  IconUpload,
  IconFileCode,
} from "@tabler/icons-react";

/**
 * Unified VPN Profile Modal
 *
 * mode="import" → full form: file picker + name + username + dynamic password
 * mode="edit"   → edit form: name + username + dynamic password (no file picker)
 */
type VpnProfileModalProps = Readonly<{
  mode: "import" | "edit";
  profileName: string | null; // null for import, existing name for edit
  opened: boolean;
  onClose: () => void;
  onSaved: () => void;
}>;

const generateId = () => Math.random().toString(36).substring(2, 9);

export function VpnProfileModal({
  mode,
  profileName: initialProfileName,
  opened,
  onClose,
  onSaved,
}: VpnProfileModalProps) {
  const { t } = useTranslation();
  const isImport = mode === "import";

  // --- Import-only state ---
  const [configContent, setConfigContent] = useState("");
  const [fileName, setFileName] = useState("");
  const [vpnType, setVpnType] = useState<string>("openvpn");

  // --- Shared state ---
  const [profileName, setProfileName] = useState("");
  const [username, setUsername] = useState("");
  const [parts, setParts] = useState<PasswordPart[]>([]);
  const [hasStoredCredentials, setHasStoredCredentials] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // --- Load existing credentials for edit mode ---
  useEffect(() => {
    if (!opened) return;

    if (isImport) {
      // Reset for a fresh import
      setProfileName("");
      setUsername("");
      setParts([]);
      setConfigContent("");
      setFileName("");
      setVpnType("openvpn");
      setHasStoredCredentials(false);
      setError(null);
      return;
    }

    // Edit mode: load existing data
    if (!initialProfileName) return;

    setProfileName(initialProfileName);
    let cancelled = false;

    void (async () => {
      setIsLoading(true);
      setError(null);

      try {
        const view = await fetchVpnProfileCredentials(initialProfileName);
        if (cancelled) return;

        setUsername(view.username);
        setHasStoredCredentials(view.hasStoredCredentials);
        const partsWithIds = view.parts.map((p) => ({
          ...p,
          id: p.id || generateId(),
        }));
        setParts(partsWithIds);
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
  }, [opened, isImport, initialProfileName, t]);

  function resetForm() {
    setProfileName("");
    setUsername("");
    setParts([]);
    setConfigContent("");
    setFileName("");
    setVpnType("openvpn");
    setHasStoredCredentials(false);
    setError(null);
  }

  function handleClose() {
    resetForm();
    onClose();
  }

  // --- File handling (import only) ---
  const handleFileChange = async (file: File | null) => {
    if (!file) return;
    setError(null);
    setFileName(file.name);

    const extIdx = file.name.lastIndexOf(".");
    const suggestedName =
      extIdx > 0 ? file.name.substring(0, extIdx) : file.name;
    if (!profileName) setProfileName(suggestedName);

    const extension = file.name.substring(extIdx + 1).toLowerCase();
    setVpnType(extension === "conf" ? "wireguard" : "openvpn");

    try {
      const text = await file.text();
      setConfigContent(text);
    } catch (err) {
      setError(String(err));
    }
  };

  // --- Password parts management ---
  const addPart = (type: "static" | "totp") => {
    const newPart: PasswordPart =
      type === "static"
        ? { id: generateId(), type: "static", value: "" }
        : { id: generateId(), type: "totp", secret: "" };
    setParts([...parts, newPart]);
    setError(null);
  };

  const removePart = (id: string) => {
    setParts(parts.filter((p) => p.id !== id));
    setError(null);
  };

  const moveUp = (index: number) => {
    if (index === 0) return;
    const newParts = [...parts];
    const temp = newParts[index];
    newParts[index] = newParts[index - 1];
    newParts[index - 1] = temp;
    setParts(newParts);
  };

  const moveDown = (index: number) => {
    if (index === parts.length - 1) return;
    const newParts = [...parts];
    const temp = newParts[index];
    newParts[index] = newParts[index + 1];
    newParts[index + 1] = temp;
    setParts(newParts);
  };

  const updatePart = (id: string, updates: Partial<PasswordPart>) => {
    setParts(
      parts.map((p) => {
        if (p.id === id) {
          return { ...p, ...updates } as PasswordPart;
        }
        return p;
      })
    );
    setError(null);
  };

  // --- Save handler ---
  async function handleSave() {
    const trimmedName = profileName.trim();
    if (!trimmedName) {
      setError(t("home.vpnProfiles.importModal.profileName"));
      return;
    }

    if (isImport && !configContent.trim()) {
      setError(t("home.vpnProfiles.importModal.fileLabel"));
      return;
    }

    // Validate password parts if any exist
    for (const part of parts) {
      if (part.type === "static" && !part.value.trim()) {
        setError(t("home.vpnCredentials.staticPlaceholder"));
        return;
      }
      if (part.type === "totp" && !part.secret.trim()) {
        setError(t("home.vpnCredentials.totpPlaceholder"));
        return;
      }
    }

    setIsSaving(true);
    setError(null);

    try {
      // 1. Import config file (import mode only)
      if (isImport) {
        await importVpnProfile(
          trimmedName,
          vpnType,
          configContent,
          username.trim()
        );
      }

      // 2. Save credentials (both modes, if parts exist or username is set)
      if (parts.length > 0 || username.trim()) {
        const payloadParts = parts.map((part) => {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { id, ...rest } = part;
          return rest;
        });

        await saveVpnProfileCredentials({
          profileName: trimmedName,
          parts: payloadParts,
          username: username.trim(),
        });
      }

      notifications.show({
        title: isImport
          ? t("home.vpnProfiles.notifications.imported.title")
          : t("home.vpnCredentials.notifications.saved.title"),
        message: isImport
          ? t("home.vpnProfiles.notifications.imported.message", {
              profile: trimmedName,
            })
          : t("home.vpnCredentials.notifications.saved.message", {
              profile: trimmedName,
            }),
        color: "green",
      });

      onSaved();
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsSaving(false);
    }
  }

  // --- Remove credentials handler (edit mode only) ---
  async function handleRemove() {
    const name = initialProfileName ?? profileName;
    if (!name) return;

    setIsRemoving(true);
    setError(null);

    try {
      await removeVpnProfileCredentials(name);
      notifications.show({
        title: t("home.vpnCredentials.notifications.removed.title"),
        message: t("home.vpnCredentials.notifications.removed.message", {
          profile: name,
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

  // --- Password preview ---
  const preview = parts
    .map((p) =>
      p.type === "static"
        ? `{${t("home.vpnCredentials.partStatic")}}`
        : `{${t("home.vpnCredentials.partTotp")}}`
    )
    .join("");

  const modalTitle = isImport
    ? t("home.vpnProfiles.importModal.title")
    : t("home.vpnCredentials.title", { profile: initialProfileName ?? "" });

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title={modalTitle}
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

        {/* === File picker (import mode only) === */}
        {isImport && (
          <>
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
          </>
        )}

        {/* === Profile name === */}
        <TextInput
          label={t("home.vpnProfiles.importModal.profileName")}
          placeholder="e.g. My Company VPN"
          value={profileName}
          onChange={(e) => setProfileName(e.currentTarget.value)}
          required
        />

        {/* === Username === */}
        <SettingField
          label={t("home.vpnCredentials.username")}
          description={t("home.vpnCredentials.usernameHelp")}
        >
          <TextInput
            value={username}
            onChange={(e) => setUsername(e.currentTarget.value)}
            placeholder={t("home.vpnCredentials.noUsernameDetected")}
          />
        </SettingField>

        {/* === Dynamic password builder === */}
        <SettingField
          label={t("home.vpnCredentials.passwordStructure")}
          description={t("home.vpnCredentials.passwordStructureHelp")}
        >
          <Stack gap="sm" mt="xs">
            {parts.length > 0 && (
              <Box
                style={{
                  border: "1px solid var(--mantine-color-default-border)",
                  borderRadius: "var(--mantine-radius-sm)",
                  padding:
                    "var(--mantine-spacing-xs) var(--mantine-spacing-sm)",
                  backgroundColor: "var(--mantine-color-default-hover)",
                }}
              >
                <Text
                  size="xs"
                  fw={700}
                  c="green"
                  ta="center"
                  style={{ fontFamily: "monospace" }}
                >
                  {preview}
                </Text>
              </Box>
            )}

            {parts.length === 0 ? (
              <Box
                style={{
                  border: "1px dashed var(--mantine-color-default-border)",
                  borderRadius: "var(--mantine-radius-sm)",
                  padding: "var(--mantine-spacing-md)",
                  textAlign: "center",
                }}
              >
                <Text size="sm" c="dimmed">
                  {t("home.vpnCredentials.emptyParts")}
                </Text>
              </Box>
            ) : (
              parts.map((part, index) => (
                <Card key={part.id} withBorder padding="xs" radius="sm">
                  <Group justify="space-between" mb="xs">
                    <Group gap="xs">
                      {part.type === "static" ? (
                        <IconAlignLeft
                          size={16}
                          color="var(--mantine-color-blue-filled)"
                        />
                      ) : (
                        <IconDeviceMobile
                          size={16}
                          color="var(--mantine-color-teal-filled)"
                        />
                      )}
                      <Text size="xs" fw={700}>
                        {part.type === "static"
                          ? t("home.vpnCredentials.partStatic")
                          : t("home.vpnCredentials.partTotp")}
                      </Text>
                    </Group>
                    <Group gap={4}>
                      <ActionIcon
                        size="sm"
                        variant="subtle"
                        color="gray"
                        disabled={index === 0}
                        onClick={() => moveUp(index)}
                        aria-label="Move Up"
                      >
                        <IconArrowUp size={14} />
                      </ActionIcon>
                      <ActionIcon
                        size="sm"
                        variant="subtle"
                        color="gray"
                        disabled={index === parts.length - 1}
                        onClick={() => moveDown(index)}
                        aria-label="Move Down"
                      >
                        <IconArrowDown size={14} />
                      </ActionIcon>
                      <ActionIcon
                        size="sm"
                        variant="subtle"
                        color="red"
                        onClick={() => removePart(part.id)}
                        aria-label="Remove"
                      >
                        <IconTrash size={14} />
                      </ActionIcon>
                    </Group>
                  </Group>

                  {part.type === "static" ? (
                    <PasswordInput
                      value={part.value}
                      onChange={(e) =>
                        updatePart(part.id, { value: e.currentTarget.value })
                      }
                      placeholder={t("home.vpnCredentials.staticPlaceholder")}
                      size="sm"
                    />
                  ) : (
                    <PasswordInput
                      value={part.secret}
                      onChange={(e) =>
                        updatePart(part.id, { secret: e.currentTarget.value })
                      }
                      placeholder={t("home.vpnCredentials.totpPlaceholder")}
                      size="sm"
                    />
                  )}
                </Card>
              ))
            )}

            <Group justify="flex-end" align="center" mt="xs">
              <Menu position="bottom-end" shadow="md">
                <Menu.Target>
                  <Button
                    variant="light"
                    size="xs"
                    leftSection={<IconPlus size={14} />}
                  >
                    {t("home.vpnCredentials.addPart")}
                  </Button>
                </Menu.Target>
                <Menu.Dropdown>
                  <Menu.Item
                    leftSection={<IconAlignLeft size={14} />}
                    onClick={() => addPart("static")}
                  >
                    {t("home.vpnCredentials.partStatic")}
                  </Menu.Item>
                  <Menu.Item
                    leftSection={<IconDeviceMobile size={14} />}
                    onClick={() => addPart("totp")}
                  >
                    {t("home.vpnCredentials.partTotp")}
                  </Menu.Item>
                </Menu.Dropdown>
              </Menu>
            </Group>
          </Stack>
        </SettingField>

        {/* === Action buttons === */}
        <Group justify="space-between" gap="sm" wrap="wrap" mt="md">
          {!isImport ? (
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
          ) : (
            <div />
          )}

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
              disabled={isImport ? !configContent : false}
              onClick={() => {
                void handleSave();
              }}
            >
              {isImport
                ? t("home.vpnProfiles.importModal.submit")
                : t("home.vpnCredentials.save")}
            </Button>
          </Group>
        </Group>
      </Stack>
    </Modal>
  );
}
