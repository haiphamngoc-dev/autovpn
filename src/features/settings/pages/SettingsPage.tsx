import {
  AboutAuthorCard,
  AppearanceCard,
  AppLockCard,
  AutoConnectCard,
  AutoReconnectCard,
  SystemIntegrationCard,
  WindowBehaviorCard,
  AppVersionCard,
} from "@features/settings/components";
import { Box } from "@mantine/core";
import { pageContentStyles } from "@shared/layout";

export function SettingsPage() {
  return (
    <Box className={pageContentStyles.page}>
      <Box className={pageContentStyles.stack}>
        <AppearanceCard />
        <AutoConnectCard />
        <AutoReconnectCard />
        <SystemIntegrationCard />
        <WindowBehaviorCard />
        <AppLockCard />
        <AppVersionCard />
        <AboutAuthorCard />
      </Box>
    </Box>
  );
}
