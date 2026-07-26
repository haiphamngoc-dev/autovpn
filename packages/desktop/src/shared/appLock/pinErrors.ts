import type { TFunction } from "i18next";
import { MAX_PIN_LENGTH, MIN_PIN_LENGTH } from "./pinPolicy";

export function normalizePinErrorCode(message: string): string {
  if (message.includes("pin_invalid_length")) {
    return "pin_invalid_length";
  }

  if (message.includes("pin_not_persisted")) {
    return "pin_not_persisted";
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
    case "pin_not_persisted":
      return t("settings.appLock.errors.notPersisted");
    default:
      return t("settings.appLock.notifications.pinSaveFailed.message");
  }
}
