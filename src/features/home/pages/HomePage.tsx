import { VpnStatusCard } from "@features/home/components/VpnStatusCard";
import { Box } from "@mantine/core";
import { pageContentStyles } from "@shared/layout";

export function HomePage() {
  return (
    <Box className={pageContentStyles.page}>
      <Box className={pageContentStyles.stack}>
        <VpnStatusCard />
      </Box>
    </Box>
  );
}
