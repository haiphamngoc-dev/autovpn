import { getCurrentWindow } from "@tauri-apps/api/window";
import { Box } from "@mantine/core";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import styles from "./WindowResizeHandles.module.css";

const appWindow = getCurrentWindow();

const RESIZE_EDGES = [
  "North",
  "South",
  "East",
  "West",
  "NorthEast",
  "NorthWest",
  "SouthEast",
  "SouthWest",
] as const;

type ResizeEdge = (typeof RESIZE_EDGES)[number];

const edgeClass: Record<ResizeEdge, string> = {
  North: styles.north,
  South: styles.south,
  East: styles.east,
  West: styles.west,
  NorthEast: styles.northeast,
  NorthWest: styles.northwest,
  SouthEast: styles.southeast,
  SouthWest: styles.southwest,
};

const edgeLabelKey: Record<ResizeEdge, string> = {
  North: "window.resize.north",
  South: "window.resize.south",
  East: "window.resize.east",
  West: "window.resize.west",
  NorthEast: "window.resize.northEast",
  NorthWest: "window.resize.northWest",
  SouthEast: "window.resize.southEast",
  SouthWest: "window.resize.southWest",
};

export function WindowResizeHandles() {
  const { t } = useTranslation();
  const edgeLabels = useMemo(
    () =>
      Object.fromEntries(
        RESIZE_EDGES.map((edge) => [edge, t(edgeLabelKey[edge])])
      ) as Record<ResizeEdge, string>,
    [t]
  );

  return (
    <Box className={styles.root}>
      {RESIZE_EDGES.map((edge) => (
        <button
          key={edge}
          type="button"
          className={`${styles.edge} ${edgeClass[edge]}`}
          aria-label={edgeLabels[edge]}
          onMouseDown={(event) => {
            event.preventDefault();
            void appWindow.startResizeDragging(edge);
          }}
        />
      ))}
    </Box>
  );
}
