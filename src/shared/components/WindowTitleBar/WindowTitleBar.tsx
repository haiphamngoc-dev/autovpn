import { Box, Flex, Group, Image, Text, UnstyledButton } from "@mantine/core";
import { useWindowControls } from "@shared/hooks";
import { useTranslation } from "react-i18next";
import { CloseIcon, MaximizeIcon, MinimizeIcon, RestoreIcon } from "./icons";
import styles from "./WindowsTitleBar.module.css";

export function WindowTitleBar() {
  const { t } = useTranslation();
  const { maximized, minimize, toggleMaximize, close, startDrag } =
    useWindowControls();

  return (
    <Box className={styles.titlebar} component="header">
      <Flex align="center" h="100%" w="100%">
        <Box
          className={styles.dragRegion}
          data-tauri-drag-region
          onMouseDown={startDrag}
          onDoubleClick={toggleMaximize}
        >
          <Group gap="xs" wrap="nowrap" className={styles.brand}>
            <Image
              className={styles.logo}
              src="/tauri.svg"
              alt=""
              w={16}
              h={16}
              fit="contain"
            />
            <Text size="sm" fw={500} truncate>
              {t("app.name")}
            </Text>
          </Group>
        </Box>
        <Group gap={0} wrap="nowrap" className={styles.controls}>
          <UnstyledButton
            className={styles.control}
            aria-label={t("window.minimize")}
            title={t("window.minimize")}
            onClick={minimize}
          >
            <MinimizeIcon size={24} />
          </UnstyledButton>
          <UnstyledButton
            className={styles.control}
            aria-label={maximized ? t("window.restore") : t("window.maximize")}
            title={maximized ? t("window.restore") : t("window.maximize")}
            onClick={toggleMaximize}
          >
            {maximized ? <RestoreIcon size={24} /> : <MaximizeIcon size={24} />}
          </UnstyledButton>
          <UnstyledButton
            className={`${styles.control} ${styles.controlClose}`}
            aria-label={t("window.close")}
            title={t("window.close")}
            onClick={close}
          >
            <CloseIcon size={24} />
          </UnstyledButton>
        </Group>
      </Flex>
    </Box>
  );
}
