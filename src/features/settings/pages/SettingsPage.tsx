import {
  AppearanceCard,
  AppLockCard,
  SystemIntegrationCard,
  WindowBehaviorCard,
} from "@features/settings/components";
import { Box } from "@mantine/core";
import { pageContentStyles } from "@shared/layout";

export function SettingsPage() {
  return (
    <Box className={pageContentStyles.page}>
      <Box className={pageContentStyles.stack}>
        <AppearanceCard />
        <SystemIntegrationCard />
        <WindowBehaviorCard />
        <AppLockCard />
      </Box>
    </Box>
  );
}
