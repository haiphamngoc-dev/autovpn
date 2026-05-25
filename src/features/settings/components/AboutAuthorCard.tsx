import { ActionIcon, Box, Group, Text, Badge, Button } from "@mantine/core";
import { IconBrandGithub, IconUserCircle, IconMessageReport } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { settingCardStyles } from "@shared/layout";
import { openUrl } from "@tauri-apps/plugin-opener";

export function AboutAuthorCard() {
  const { t } = useTranslation();

  const handleOpenGithub = () => {
    void openUrl("https://github.com/haiphamngoc-dev/autovpn");
  };

  const handleOpenFeedback = () => {
    void openUrl("https://github.com/haiphamngoc-dev/autovpn/issues");
  };

  return (
    <Box className={settingCardStyles.card}>
      <Group gap={6} mb="md" wrap="nowrap">
        <IconUserCircle
          size={16}
          stroke={1.5}
          color="var(--mantine-color-dimmed)"
        />
        <Text className={settingCardStyles.sectionTitle} mb={0}>
          {t("settings.aboutAuthor.title")}
        </Text>
      </Group>

      <Group justify="space-between" align="center">
        <Box>
          <Text size="sm" fw={500}>
            Hai Pham Ngoc
          </Text>
          <Text size="xs" c="dimmed">
            {t("settings.aboutAuthor.role")}
          </Text>
        </Box>

        <Group gap="xs">
          <Button
            variant="light"
            color="blue"
            size="xs"
            leftSection={<IconMessageReport size={14} />}
            onClick={handleOpenFeedback}
          >
            {t("settings.aboutAuthor.feedback", { defaultValue: "Feedback" })}
          </Button>

          <ActionIcon
            variant="light"
            color="gray"
            size="md"
            onClick={handleOpenGithub}
            aria-label="GitHub Repository"
          >
            <IconBrandGithub size={16} stroke={1.5} />
          </ActionIcon>
        </Group>
      </Group>

      <Group justify="space-between" align="center" mt="md" pt="sm" style={{ borderTop: "1px solid var(--mantine-color-default-border)" }}>
        <Box>
          <Text size="xs" c="dimmed">
            {t("settings.aboutAuthor.license")}
          </Text>
          <Text size="xs" fw={500} c="dimmed">
            MIT License &copy; 2026 Hai Pham Ngoc
          </Text>
        </Box>
        <Badge variant="outline" color="blue" size="sm">
          MIT
        </Badge>
      </Group>
    </Box>
  );
}
