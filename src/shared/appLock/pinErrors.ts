import type { TFunction } from "i18next";
import { MAX_PIN_LENGTH, MIN_PIN_LENGTH } from "./pinPolicy";

export function normalizePinErrorCode(message: string): string {
  if (message.includes("pin_invalid_length")) {
    return "pin_invalid_length";
  }

  return message;
}

export function getPinErrorMessage(code: string, t: TFunction): string {
  switch (normalizePinErrorCode(code)) {
    case "pin_invalid_length":
      return t("settings.appLock.errors.invalidLength", {
        min: MIN_PIN_LENGTH,
        max: MAX_PIN_LENGTH,
      });
    default:
      return t("settings.appLock.notifications.pinSaveFailed.message");
  }
}
