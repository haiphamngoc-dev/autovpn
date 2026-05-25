import { VpnProfileListCard } from "@features/home/components/VpnProfileListCard";
import { VpnStatusCard } from "@features/home/components/VpnStatusCard";
import { VpnLogConsoleCard } from "@features/home/components/VpnLogConsoleCard";
import { Box } from "@mantine/core";
import { pageContentStyles } from "@shared/layout";

export function HomePage() {
  return (
    <Box className={pageContentStyles.page}>
      <Box className={pageContentStyles.stack}>
        <VpnStatusCard />
        <VpnProfileListCard />
        <VpnLogConsoleCard />
      </Box>
    </Box>
  );
}
