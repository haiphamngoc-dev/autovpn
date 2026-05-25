import { Box, Checkbox, Text, Tooltip, ActionIcon, Group } from "@mantine/core";
import { settingCardStyles } from "@shared/layout";
import { IconTerminal, IconTrash, IconCopy, IconCheck } from "@tabler/icons-react";
import { listen } from "@tauri-apps/api/event";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import styles from "./VpnLogConsoleCard.module.css";

interface LogEntry {
  timestamp: string;
  level: string;
  source: string;
  message: string;
}

export function VpnLogConsoleCard() {
  const { t } = useTranslation();
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [autoscroll, setAutoscroll] = useState(true);
  const [copied, setCopied] = useState(false);
  const consoleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Listen to "vpn-log" events from Tauri backend
    const unlistenPromise = listen<LogEntry>("vpn-log", (event) => {
      setLogs((prev) => {
        const next = [...prev, event.payload];
        // Limit to latest 100 entries to prevent memory bloat
        return next.slice(-100);
      });
    });

    return () => {
      void unlistenPromise.then((unlisten) => unlisten());
    };
  }, []);

  // Handle autoscroll
  useEffect(() => {
    if (autoscroll && consoleRef.current) {
      consoleRef.current.scrollTop = consoleRef.current.scrollHeight;
    }
  }, [logs, autoscroll]);

  function handleClear() {
    setLogs([]);
  }

  function handleCopy() {
    if (logs.length === 0) return;
    const text = logs
      .map((log) => `[${log.timestamp}] [${log.level.toUpperCase()}] [${log.source}] ${log.message}`)
      .join("\n");
    void navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Box className={settingCardStyles.card}>
      <div className={styles.cardHeader}>
        <div className={styles.titleGroup}>
          <IconTerminal size={16} stroke={1.5} color="var(--mantine-color-dimmed)" />
          <Text className={settingCardStyles.sectionTitle} mb={0}>
            {t("home.vpnLogs.title")}
          </Text>
        </div>

        <Group gap="xs" className={styles.actionsGroup}>
          <Checkbox
            size="xs"
            label={t("home.vpnLogs.autoscroll")}
            checked={autoscroll}
            onChange={(event) => setAutoscroll(event.currentTarget.checked)}
          />

          <Tooltip label={copied ? t("home.vpnLogs.copied") : t("home.vpnLogs.copy")}>
            <ActionIcon
              variant="subtle"
              color={copied ? "green" : "gray"}
              onClick={handleCopy}
              disabled={logs.length === 0}
              aria-label="Copy logs"
            >
              {copied ? <IconCheck size={14} /> : <IconCopy size={14} />}
            </ActionIcon>
          </Tooltip>

          <Tooltip label={t("home.vpnLogs.clear")}>
            <ActionIcon
              variant="subtle"
              color="red"
              onClick={handleClear}
              disabled={logs.length === 0}
              aria-label="Clear logs"
            >
              <IconTrash size={14} />
            </ActionIcon>
          </Tooltip>
        </Group>
      </div>

      <div ref={consoleRef} className={styles.consoleContainer}>
        {logs.length === 0 ? (
          <div className={styles.emptyState}>{t("home.vpnLogs.empty")}</div>
        ) : (
          logs.map((log, index) => (
            <div key={index} className={styles.logLine}>
              <span className={styles.logTimestamp}>[{log.timestamp}]</span>
              <span className={`${styles.logLevel} ${styles[`level_${log.level}`]}`}>
                [{log.level.toUpperCase()}]
              </span>
              <span className={styles.logSource}>[{log.source}]</span>
              <span className={styles.logMessage}>{log.message}</span>
            </div>
          ))
        )}
      </div>
    </Box>
  );
}
