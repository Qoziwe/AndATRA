import {
  BACKEND_URL,
  ENABLE_RENDER_KEEPALIVE,
  RENDER_KEEPALIVE_INTERVAL_MS,
  TELEGRAM_BOT_URL
} from "@/constants/config";

const normalizeBaseUrl = (value: string) => value.trim().replace(/\/+$/, "");

const buildTargets = () =>
  [
    normalizeBaseUrl(BACKEND_URL) ? `${normalizeBaseUrl(BACKEND_URL)}/api/ready` : "",
    normalizeBaseUrl(TELEGRAM_BOT_URL) || ""
  ].filter(Boolean);

const pingViaFetch = async (url: string) => {
  try {
    await fetch(`${url}${url.includes("?") ? "&" : "?"}t=${Date.now()}`, {
      method: "GET",
      cache: "no-store",
      mode: "no-cors"
    });
  } catch {
    // Best-effort keepalive only.
  }
};

export const startKeepAlive = () => {
  if (!ENABLE_RENDER_KEEPALIVE || typeof globalThis.setInterval !== "function") {
    return () => undefined;
  }

  const targets = buildTargets();
  if (targets.length === 0) {
    return () => undefined;
  }

  let disposed = false;

  const tick = () => {
    if (disposed) {
      return;
    }

    if (
      typeof document !== "undefined" &&
      typeof document.visibilityState === "string" &&
      document.visibilityState !== "visible"
    ) {
      return;
    }

    targets.forEach((url) => {
      void pingViaFetch(url);
    });
  };

  tick();
  const intervalId = globalThis.setInterval(tick, Math.max(RENDER_KEEPALIVE_INTERVAL_MS, 60_000));

  const handleVisibilityChange = () => {
    if (typeof document !== "undefined" && document.visibilityState === "visible") {
      tick();
    }
  };

  if (typeof document !== "undefined") {
    document.addEventListener("visibilitychange", handleVisibilityChange);
  }

  return () => {
    disposed = true;
    globalThis.clearInterval(intervalId);
    if (typeof document !== "undefined") {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    }
  };
};
