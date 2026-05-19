export type TauriPlatform = NonNullable<ImportMetaEnv["TAURI_ENV_PLATFORM"]>;

export function getTauriPlatform(): TauriPlatform | undefined {
  return import.meta.env.TAURI_ENV_PLATFORM;
}

export const resolvePlatform = getTauriPlatform;

export function isTauriBuild(): boolean {
  return getTauriPlatform() !== undefined;
}

const platform = getTauriPlatform();

export const isLinux = platform === "linux";
export const isDarwin = platform === "darwin";
export const isWindows = platform === "windows";
export const isAndroid = platform === "android";
export const isIos = platform === "ios";
