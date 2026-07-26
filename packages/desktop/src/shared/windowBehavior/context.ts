import type { WindowBehaviorSettings } from "@shared/settings/windowBehavior";

export type WindowBehaviorContextValue = {
  settings: WindowBehaviorSettings;
  showCustomTitleBar: boolean;
  updateSettings: (
    partial: Partial<WindowBehaviorSettings>
  ) => Promise<{ persisted: boolean }>;
};
