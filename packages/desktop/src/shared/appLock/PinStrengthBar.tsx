import { Box, Text } from "@mantine/core";
import { useTranslation } from "react-i18next";
import {
  getPinStrengthColor,
  getPinStrengthLabelKey,
  getPinStrengthLevel,
} from "./pinStrength";
import styles from "./PinStrengthBar.module.css";

type PinStrengthBarProps = {
  pin: string;
};

export function PinStrengthBar({ pin }: Readonly<PinStrengthBarProps>) {
  const { t } = useTranslation();
  const level = getPinStrengthLevel(pin);

  if (pin.length === 0) {
    return null;
  }

  const color = getPinStrengthColor(level);
  const labelKey = getPinStrengthLabelKey(level);

  return (
    <Box
      className={styles.root}
      style={{ "--pin-strength-color": `var(--mantine-color-${color}-6)` }}
    >
      <Box className={styles.segments} aria-hidden>
        {[1, 2, 3, 4].map((segment) => (
          <Box
            key={segment}
            className={`${styles.segment} ${segment <= level ? styles.segmentActive : ""}`}
          />
        ))}
      </Box>
      <Text className={styles.label}>
        {t(`settings.appLock.strength.${labelKey}`)}
      </Text>
    </Box>
  );
}
