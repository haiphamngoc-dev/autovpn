import { TITLEBAR_ICON_SIZE, type SvgIconProps } from "./types";

export function MinimizeIcon({
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
      <path d="M6 19h12v2H6z" />
    </svg>
  );
}
