const env =
  (globalThis as typeof globalThis & {
    process?: {
      env?: Record<string, string | undefined>;
    };
  }).process?.env ?? {};

export const APP_NAME = env.EXPO_PUBLIC_APP_NAME ?? "AndATRA";
export const BACKEND_URL = env.EXPO_PUBLIC_BACKEND_URL ?? "http://localhost:5000";
export const TOMTOM_TRAFFIC_API_KEY = env.EXPO_PUBLIC_TOMTOM_API_KEY ?? "";

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
  rejected: "Отклонён"
} as const;

export const PRIORITY_LABELS = {
  low: "Низкий",
  medium: "Средний",
  high: "Высокий",
  critical: "Критический"
} as const;
