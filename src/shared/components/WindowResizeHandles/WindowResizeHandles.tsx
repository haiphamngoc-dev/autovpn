import { getCurrentWindow } from "@tauri-apps/api/window";
import { Box } from "@mantine/core";
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

export function WindowResizeHandles() {
  return (
    <Box className={styles.root} aria-hidden>
      {RESIZE_EDGES.map((edge) => (
        <div
          key={edge}
          className={`${styles.edge} ${edgeClass[edge]}`}
          onMouseDown={() => void appWindow.startResizeDragging(edge)}
        />
      ))}
    </Box>
  );
}
