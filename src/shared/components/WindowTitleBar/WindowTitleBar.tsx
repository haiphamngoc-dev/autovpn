import { getCurrentWindow } from "@tauri-apps/api/window";
import { Box, Flex, Group, Image, Text, UnstyledButton } from "@mantine/core";
import { useCallback, useEffect, useState } from "react";
import { CloseIcon, MaximizeIcon, MinimizeIcon, RestoreIcon } from "./icons";
import styles from "./WindowsTitleBar.module.css";

const APP_TITLE = "autovpn";

const appWindow = getCurrentWindow();

export function WindowTitleBar() {
  const [maximized, setMaximized] = useState(false);

  const syncMaximized = useCallback(() => {
    void appWindow.isMaximized().then(setMaximized);
  }, []);

  useEffect(() => {
    syncMaximized();
    const unlisten = appWindow.onResized(() => {
      syncMaximized();
    });
    return () => {
      void unlisten.then((fn) => fn());
    };
  }, [syncMaximized]);

  const handleToggleMaximize = () => {
    void appWindow.toggleMaximize().then(syncMaximized);
  };

  return (
    <Box className={styles.titlebar} component="header">
      <Flex align="center" h="100%" w="100%">
        <Box className={styles.dragRegion} data-tauri-drag-region>
          <Group gap="xs" wrap="nowrap" className={styles.brand}>
            <Image
              className={styles.logo}
              src="/tauri.svg"
              alt=""
              w={24}
              h={24}
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
            onClick={() => void appWindow.minimize()}
          >
            <MinimizeIcon size={24} />
          </UnstyledButton>
          <UnstyledButton
            className={styles.control}
            aria-label={maximized ? "Restore" : "Maximize"}
            title={maximized ? "Restore" : "Maximize"}
            onClick={handleToggleMaximize}
          >
            {maximized ? <RestoreIcon size={24} /> : <MaximizeIcon size={24} />}
          </UnstyledButton>
          <UnstyledButton
            className={`${styles.control} ${styles.controlClose}`}
            aria-label="Close"
            title="Close"
            onClick={() => void appWindow.close()}
          >
            <CloseIcon size={24} />
          </UnstyledButton>
        </Group>
      </Flex>
    </Box>
  );
}
