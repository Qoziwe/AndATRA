const env =
  (globalThis as typeof globalThis & {
    process?: {
      env?: Record<string, string | undefined>;
    };
  }).process?.env ?? {};

const runtimeLocation =
  typeof globalThis !== "undefined" &&
  "location" in globalThis &&
  globalThis.location &&
  typeof globalThis.location === "object"
    ? globalThis.location
    : undefined;

const hostname = runtimeLocation?.hostname ?? "";
const isGitHubPagesHost = hostname.endsWith(".github.io");

const defaultBackendUrl = isGitHubPagesHost
  ? "https://andatra-backend.onrender.com"
  : "http://localhost:5000";
const defaultTelegramBotUrl = isGitHubPagesHost ? "https://andatra-telegram-bot.onrender.com" : "";

export const APP_NAME = env.EXPO_PUBLIC_APP_NAME ?? "AndATRA";
export const BACKEND_URL = env.EXPO_PUBLIC_BACKEND_URL ?? defaultBackendUrl;
export const TELEGRAM_BOT_URL = env.EXPO_PUBLIC_TELEGRAM_BOT_URL ?? defaultTelegramBotUrl;
export const TOMTOM_TRAFFIC_API_KEY = env.EXPO_PUBLIC_TOMTOM_API_KEY ?? "";
export const AIR_QUALITY_API_URL =
  env.EXPO_PUBLIC_AIR_QUALITY_API_URL ?? "https://air-quality-api.open-meteo.com/v1/air-quality";
export const ENABLE_RENDER_KEEPALIVE = (env.EXPO_PUBLIC_ENABLE_RENDER_KEEPALIVE ?? "false") === "true";
export const RENDER_KEEPALIVE_INTERVAL_MS = Number(
  env.EXPO_PUBLIC_RENDER_KEEPALIVE_INTERVAL_MS ?? "480000"
);

export const getTomTomTrafficTileUrl = (style: "relative0" | "relative0-dark" = "relative0") =>
  TOMTOM_TRAFFIC_API_KEY
    ? `https://api.tomtom.com/traffic/map/4/tile/flow/${style}/{z}/{x}/{y}.png?key=${encodeURIComponent(
        TOMTOM_TRAFFIC_API_KEY
      )}&tileSize=256`
    : undefined;

export const CATEGORY_COLORS = {
  transport: "#3B82F6",
  ecology: "#22C55E",
  safety: "#EF4444",
  aryk_monitoring: "#06B6D4",
  social: "#8B5CF6",
  healthcare: "#F97316",
  infrastructure: "#EAB308",
  utilities: "#14B8A6",
  default: "#64748B"
} as const;

export const STATUS_LABELS = {
  new: "Новый",
  processing: "В работе",
  resolved: "Решён",
  rejected: "Отклонён",
  irrelevant: "Неактуально"
} as const;

export const PRIORITY_LABELS = {
  low: "Низкий",
  medium: "Средний",
  high: "Высокий",
  critical: "Критический"
} as const;
