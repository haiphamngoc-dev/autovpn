import type { MantineColor } from "@mantine/core";
import { MAX_PIN_LENGTH, MIN_PIN_LENGTH } from "./pinPolicy";

export type PinStrengthLevel = 0 | 1 | 2 | 3 | 4;

const STRENGTH_LABEL_KEYS = ["", "weak", "fair", "good", "strong"] as const;

export function getPinStrengthLevel(pin: string): PinStrengthLevel {
  if (pin.length === 0) {
    return 0;
  }

  let score = 0;

  if (pin.length >= MIN_PIN_LENGTH) {
    score += 1;
  }

  if (pin.length >= 8) {
    score += 1;
  }

  if (pin.length >= 12) {
    score += 1;
  }

  if (/[a-z]/.test(pin)) {
    score += 1;
  }

  if (/[A-Z]/.test(pin)) {
    score += 1;
  }

  if (/\d/.test(pin)) {
    score += 1;
  }

  if (/[^a-zA-Z0-9]/.test(pin)) {
    score += 1;
  }

  if (score <= 2) {
    return 1;
  }

  if (score <= 4) {
    return 2;
  }

  if (score <= 6) {
    return 3;
  }

  return 4;
}

export function getPinStrengthColor(level: PinStrengthLevel): MantineColor {
  switch (level) {
    case 1:
      return "red";
    case 2:
      return "orange";
    case 3:
      return "yellow";
    case 4:
      return "green";
    default:
      return "gray";
  }
}

export function getPinStrengthLabelKey(
  level: PinStrengthLevel
): (typeof STRENGTH_LABEL_KEYS)[number] {
  return STRENGTH_LABEL_KEYS[level];
}

export function isPinWithinLengthLimits(pin: string): boolean {
  return pin.length >= MIN_PIN_LENGTH && pin.length <= MAX_PIN_LENGTH;
}
