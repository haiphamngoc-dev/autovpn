import { Box, Flex, Group, Image, Text, UnstyledButton } from "@mantine/core";
import { useWindowControls } from "@shared/hooks";
import { CloseIcon, MaximizeIcon, MinimizeIcon, RestoreIcon } from "./icons";
import styles from "./WindowsTitleBar.module.css";

const APP_TITLE = "autovpn";

export function WindowTitleBar() {
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
              {APP_TITLE}
            </Text>
          </Group>
        </Box>
        <Group gap={0} wrap="nowrap" className={styles.controls}>
          <UnstyledButton
            className={styles.control}
            aria-label="Minimize"
            title="Minimize"
            onClick={minimize}
          >
            <MinimizeIcon size={24} />
          </UnstyledButton>
          <UnstyledButton
            className={styles.control}
            aria-label={maximized ? "Restore" : "Maximize"}
            title={maximized ? "Restore" : "Maximize"}
            onClick={toggleMaximize}
          >
            {maximized ? <RestoreIcon size={24} /> : <MaximizeIcon size={24} />}
          </UnstyledButton>
          <UnstyledButton
            className={`${styles.control} ${styles.controlClose}`}
            aria-label="Close"
            title="Close"
            onClick={close}
          >
            <CloseIcon size={24} />
          </UnstyledButton>
        </Group>
      </Flex>
    </Box>
  );
}
