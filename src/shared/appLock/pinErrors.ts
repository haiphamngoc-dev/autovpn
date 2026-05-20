import type { TFunction } from "i18next";

export function normalizePinErrorCode(message: string): string {
  if (message.includes("pin_invalid_length")) {
    return "pin_invalid_length";
  }

  if (message.includes("pin_not_digits_only")) {
    return "pin_not_digits_only";
  }

  return message;
}

export function getPinErrorMessage(code: string, t: TFunction): string {
  switch (normalizePinErrorCode(code)) {
    case "pin_invalid_length":
      return t("settings.appLock.errors.invalidLength", { min: 4, max: 8 });
    case "pin_not_digits_only":
      return t("settings.appLock.errors.notDigitsOnly");
    default:
      return t("settings.appLock.notifications.pinSaveFailed.message");
  }
}
