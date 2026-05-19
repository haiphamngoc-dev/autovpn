import type { SVGProps } from "react";

export const TITLEBAR_ICON_SIZE = 16;

/** Filled SVG icons (Material-style title bar controls). */
export type SvgIconProps = {
  size?: number | string;
  color?: string;
} & Omit<SVGProps<SVGSVGElement>, "width" | "height" | "fill" | "color">;
