/**
 * Structured logger for the SunnyTune server.
 *
 * ## Behaviour
 *
 * | Environment      | Output format                                      |
 * |------------------|----------------------------------------------------|
 * | development      | Coloured, human-readable lines to stdout/stderr    |
 * | production/test  | Newline-delimited JSON — parseable by Railway,     |
 * |                  | Vercel Log Drains, Datadog, Loki, CloudWatch, etc. |
 *
 * ## Log levels (lowest → highest)
 *   debug < info < warn < error
 *
 * Set `LOG_LEVEL=debug` in your .env to enable debug output in any env.
 * Default level is `debug` in development and `info` in production.
 *
 * ## Usage
 *   import { logger } from "../lib/logger";
 *
 *   logger.info("Server started", { port: 3001 });
 *   logger.warn("Rate limit hit", { ip: "1.2.3.4", route: "/api/configs" });
 *   logger.error("DB query failed", { err: String(e), query: "SELECT…" });
 *   logger.debug("Auth token parsed", { userId: "abc123" });
 */

type Level = "debug" | "info" | "warn" | "error";

const LEVEL_RANK: Record<Level, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

// ── Environment detection ─────────────────────────────────────────────────────

const IS_PROD =
  process.env.NODE_ENV === "production" || process.env.NODE_ENV === "test";

const configuredLevelEnv = (process.env.LOG_LEVEL ?? "").toLowerCase() as Level;
const DEFAULT_LEVEL: Level = IS_PROD ? "info" : "debug";
const ACTIVE_LEVEL: Level =
  LEVEL_RANK[configuredLevelEnv] !== undefined
    ? configuredLevelEnv
    : DEFAULT_LEVEL;

// ── Dev colour helpers ────────────────────────────────────────────────────────

const RESET = "\x1b[0m";
const BOLD = "\x1b[1m";
const DIM = "\x1b[2m";

const COLOURS: Record<Level, string> = {
  debug: "\x1b[36m", // cyan
  info: "\x1b[32m", // green
  warn: "\x1b[33m", // yellow
  error: "\x1b[31m", // red
};

const LEVEL_LABEL: Record<Level, string> = {
  debug: "DBG",
  info: "INF",
  warn: "WRN",
  error: "ERR",
};

function formatDev(
  level: Level,
  message: string,
  meta?: Record<string, unknown>,
): string {
  const ts = new Date().toTimeString().slice(0, 8); // HH:MM:SS
  const col = COLOURS[level];
  const label = LEVEL_LABEL[level];
  const metaStr = meta ? ` ${DIM}${JSON.stringify(meta)}${RESET}` : "";
  return `${DIM}${ts}${RESET} ${col}${BOLD}${label}${RESET} ${message}${metaStr}`;
}

// ── Core write ────────────────────────────────────────────────────────────────

function write(
  level: Level,
  message: string,
  meta?: Record<string, unknown>,
): void {
  if (LEVEL_RANK[level] < LEVEL_RANK[ACTIVE_LEVEL]) return;

  const isError = level === "error" || level === "warn";
  const out = isError ? process.stderr : process.stdout;

  if (IS_PROD) {
    // Compact JSON — one line per entry so log aggregators can parse it.
    const entry: Record<string, unknown> = {
      ts: new Date().toISOString(),
      level,
      message,
    };
    if (meta) entry["meta"] = meta;
    out.write(JSON.stringify(entry) + "\n");
  } else {
    out.write(formatDev(level, message, meta) + "\n");
  }
}

// ── Public API ────────────────────────────────────────────────────────────────

export const logger = {
  debug: (message: string, meta?: Record<string, unknown>) =>
    write("debug", message, meta),
  info: (message: string, meta?: Record<string, unknown>) =>
    write("info", message, meta),
  warn: (message: string, meta?: Record<string, unknown>) =>
    write("warn", message, meta),
  error: (message: string, meta?: Record<string, unknown>) =>
    write("error", message, meta),
};
