import type {
  MantineColorScheme,
  MantineColorSchemeManager,
} from "@mantine/core";

export function createAppearanceColorSchemeManager(
  initialScheme: MantineColorScheme
): MantineColorSchemeManager {
  let current: MantineColorScheme =
    initialScheme === "light" || initialScheme === "dark"
      ? initialScheme
      : "dark";

  return {
    get: (defaultValue) => current ?? defaultValue,
    set: (value) => {
      if (value === "light" || value === "dark") {
        current = value;
      }
    },
    subscribe: () => {},
    unsubscribe: () => {},
    clear: () => {
      current = "dark";
    },
  };
}
