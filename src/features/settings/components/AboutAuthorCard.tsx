import { ActionIcon, Box, Group, Text } from "@mantine/core";
import { IconBrandGithub, IconUserCircle } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { settingCardStyles } from "@shared/layout";
import { openUrl } from "@tauri-apps/plugin-opener";

export function AboutAuthorCard() {
  const { t } = useTranslation();

  const handleOpenGithub = () => {
    void openUrl("https://github.com/haiphamngoc-dev");
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

        <ActionIcon
          variant="light"
          color="gray"
          size="lg"
          onClick={handleOpenGithub}
          aria-label="GitHub Profile"
        >
          <IconBrandGithub size={18} stroke={1.5} />
        </ActionIcon>
      </Group>
    </Box>
  );
}
