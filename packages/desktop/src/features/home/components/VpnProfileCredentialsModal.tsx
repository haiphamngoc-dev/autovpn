import { SettingField } from "@features/settings/components/SettingField";
import {
  fetchVpnProfileCredentials,
  removeVpnProfileCredentials,
  saveVpnProfileCredentials,
  type PasswordPart,
} from "@shared/settings/vpn";
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
} from "@tabler/icons-react";

type VpnProfileCredentialsModalProps = Readonly<{
  profileName: string | null;
  opened: boolean;
  onClose: () => void;
  onSaved: () => void;
}>;

const generateId = () => Math.random().toString(36).substring(2, 9);

export function VpnProfileCredentialsModal({
  profileName,
  opened,
  onClose,
  onSaved,
}: VpnProfileCredentialsModalProps) {
  const { t } = useTranslation();
  const [username, setUsername] = useState("");
  const [parts, setParts] = useState<PasswordPart[]>([]);
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
        setHasStoredCredentials(view.hasStoredCredentials);

        // Add random React keys/IDs to parts for reliable list rendering
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
  }, [opened, profileName, t]);

  function resetForm() {
    setUsername("");
    setParts([]);
    setHasStoredCredentials(false);
    setError(null);
  }

  function handleClose() {
    resetForm();
    onClose();
  }

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

  async function handleSave() {
    if (!profileName) {
      return;
    }

    if (parts.length === 0) {
      setError(t("home.vpnCredentials.emptyParts"));
      return;
    }

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

    const payloadParts = parts.map((part) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { id, ...rest } = part;
      return rest;
    });

    try {
      await saveVpnProfileCredentials({
        profileName,
        parts: payloadParts,
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
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
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

  const preview = parts
    .map((p) => {
      if (p.type === "static") {
        return `{${t("home.vpnCredentials.partStatic")}}`;
      } else {
        return `{${t("home.vpnCredentials.partTotp")}}`;
      }
    })
    .join("");

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

        <Group justify="space-between" gap="sm" wrap="wrap" mt="md">
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
