import { TITLEBAR_ICON_SIZE, type SvgIconProps } from "./types";

export function RestoreIcon({
  size = TITLEBAR_ICON_SIZE,
  color = "currentColor",
  ...props
}: SvgIconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill={color}
      aria-hidden
      {...props}
    >
      <path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v3h3v-2h-5v-1zm2-12h-2v3h5V5h-3v2z" />
    </svg>
  );
}
