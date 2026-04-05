/**
 * Client-side structured logger for SunnyTune.
 *
 * ## Behaviour
 *
 * | Environment | Output                                              |
 * |-------------|-----------------------------------------------------|
 * | development | Prefixed, colour-coded console output (grouping)    |
 * | production  | Silent — no console output reaches end-users        |
 *
 * Errors are always sent to `console.error` regardless of environment so
 * they appear in Vercel's Runtime Logs and browser DevTools error panels.
 *
 * ## Usage
 *   import { log } from "../lib/logger";
 *
 *   log.info("Config loaded", { id: "abc123" });
 *   log.warn("Validation issue", { field: "CameraOffset" });
 *   log.error("API call failed", { url: "/api/configs", status: 500 });
 *   log.debug("Render cycle", { component: "ConfiguratorPage" });
 */

type Level = "debug" | "info" | "warn" | "error";

const IS_DEV = import.meta.env.DEV;

// ── Dev colour prefix ─────────────────────────────────────────────────────────

const PREFIX: Record<Level, string> = {
  debug: "%c[DBG]",
  info: "%c[INF]",
  warn: "%c[WRN]",
  error: "%c[ERR]",
};

const CSS: Record<Level, string> = {
  debug: "color:#64b5f6;font-weight:bold", // light blue
  info: "color:#66bb6a;font-weight:bold", // green
  warn: "color:#ffa726;font-weight:bold", // orange
  error: "color:#ef5350;font-weight:bold", // red
};

function write(level: Level, message: string, meta?: unknown): void {
  if (level === "error") {
    // Always emit errors — they surface in Vercel Runtime Logs
    if (meta !== undefined) {
      console.error(`[ERR] ${message}`, meta);
    } else {
      console.error(`[ERR] ${message}`);
    }
    return;
  }

  if (!IS_DEV) return; // suppress debug/info/warn in production builds

  const consoleFn =
    level === "warn"
      ? console.warn
      : level === "debug"
        ? console.debug
        : console.info;

  if (meta !== undefined) {
    consoleFn(PREFIX[level] + " " + message, CSS[level], meta);
  } else {
    consoleFn(PREFIX[level] + " " + message, CSS[level]);
  }
}

export const log = {
  debug: (message: string, meta?: unknown) => write("debug", message, meta),
  info: (message: string, meta?: unknown) => write("info", message, meta),
  warn: (message: string, meta?: unknown) => write("warn", message, meta),
  error: (message: string, meta?: unknown) => write("error", message, meta),
};

// ── Global unhandled error / promise rejection catchers ───────────────────────
// These fire in production too so errors surface in Vercel Runtime Logs
// (window.onerror and unhandledrejection events are captured by Vercel's edge).

if (typeof window !== "undefined") {
  const prev = window.onerror;
  window.onerror = (msg, src, line, col, err) => {
    log.error("Unhandled error", { msg, src, line, col, err: String(err) });
    return prev ? prev(msg, src, line, col, err) : false;
  };

  window.addEventListener("unhandledrejection", (event) => {
    log.error("Unhandled promise rejection", { reason: String(event.reason) });
  });
}
