import {
  AppearanceCard,
  AppLockCard,
  WindowBehaviorCard,
} from "@features/settings/components";
import { Box } from "@mantine/core";
import styles from "./SettingsPage.module.css";

export function SettingsPage() {
  return (
    <Box className={styles.page}>
      <Box className={styles.stack}>
        <AppearanceCard />
        <WindowBehaviorCard />
        <AppLockCard />
      </Box>
    </Box>
  );
}
