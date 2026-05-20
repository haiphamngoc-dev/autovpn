import { Box, Text } from "@mantine/core";
import type { ReactNode } from "react";
import styles from "./SettingField.module.css";

type SettingFieldProps = Readonly<{
  label: string;
  description?: string;
  children: ReactNode;
}>;

export function SettingField({
  label,
  description,
  children,
}: SettingFieldProps) {
  return (
    <Box className={styles.field}>
      <Text className={styles.fieldLabel}>{label}</Text>
      {description ? (
        <Text className={styles.fieldDescription}>{description}</Text>
      ) : null}
      {children}
    </Box>
  );
}
