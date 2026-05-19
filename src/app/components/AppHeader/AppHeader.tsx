import { Box, Text } from "@mantine/core";
import styles from "./AppHeader.module.css";

const APP_NAME = "autovpn";

export function AppHeader() {
  return (
    <Box component="header" className={styles.root}>
      <Text component="h1" size="sm" fw={600}>
        {APP_NAME}
      </Text>
    </Box>
  );
}
