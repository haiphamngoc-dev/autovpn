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

const edgeLabel: Record<ResizeEdge, string> = {
  North: "Resize window from top edge",
  South: "Resize window from bottom edge",
  East: "Resize window from right edge",
  West: "Resize window from left edge",
  NorthEast: "Resize window from top-right corner",
  NorthWest: "Resize window from top-left corner",
  SouthEast: "Resize window from bottom-right corner",
  SouthWest: "Resize window from bottom-left corner",
};

export function WindowResizeHandles() {
  return (
    <Box className={styles.root}>
      {RESIZE_EDGES.map((edge) => (
        <button
          key={edge}
          type="button"
          className={`${styles.edge} ${edgeClass[edge]}`}
          aria-label={edgeLabel[edge]}
          onMouseDown={(event) => {
            event.preventDefault();
            void appWindow.startResizeDragging(edge);
          }}
        />
      ))}
    </Box>
  );
}
