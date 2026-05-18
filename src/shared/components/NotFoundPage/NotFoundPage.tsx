import { Anchor, Stack, Text, Title } from "@mantine/core";
import { Link } from "react-router-dom";
import { paths } from "@app/routers/paths";
import styles from "./NotFoundPage.module.css";

export function NotFoundPage() {
  return (
    <div className={styles.root}>
      <Stack gap="sm" align="center">
        <Title order={1}>404</Title>
        <Text c="dimmed">Page not found</Text>
        <Anchor component={Link} to={paths.home}>
          Back to home
        </Anchor>
      </Stack>
    </div>
  );
}
