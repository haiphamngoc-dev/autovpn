import {
  loadSystemIntegrationSettings,
  saveSystemIntegrationSettings,
  type SystemIntegrationSettings,
} from "@shared/settings/systemIntegration";
import { useCallback, useEffect, useState } from "react";

export function useSystemIntegration() {
  const [settings, setSettings] = useState<SystemIntegrationSettings | null>(
    null
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const loaded = await loadSystemIntegrationSettings();
      if (!cancelled) {
        setSettings(loaded);
        setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const updateSettings = useCallback(
    async (partial: Partial<SystemIntegrationSettings>) => {
      const { settings: nextSettings, persisted } =
        await saveSystemIntegrationSettings(partial);
      setSettings(nextSettings);
      return { persisted };
    },
    []
  );

  return {
    settings,
    loading,
    updateSettings,
  };
}
