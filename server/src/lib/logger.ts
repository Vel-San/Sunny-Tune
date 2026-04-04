/**
 * Minimal structured logger.
 * Outputs newline-delimited JSON to stdout/stderr so log aggregators
 * (Loki, Datadog, CloudWatch, etc.) can parse fields directly.
 *
 * Usage:
 *   logger.info("Server started", { port: 3001 });
 *   logger.error("DB query failed", { err: e.message, query: "SELECT…" });
 */

type Level = "debug" | "info" | "warn" | "error";

function write(level: Level, message: string, meta?: Record<string, unknown>) {
  const entry: Record<string, unknown> = {
    ts: new Date().toISOString(),
    level,
    message,
    ...(meta && { meta }),
  };
  const line = JSON.stringify(entry) + "\n";
  if (level === "error" || level === "warn") {
    process.stderr.write(line);
  } else {
    process.stdout.write(line);
  }
}

export const logger = {
  debug: (message: string, meta?: Record<string, unknown>) => {
    if (process.env.NODE_ENV !== "production") write("debug", message, meta);
  },
  info: (message: string, meta?: Record<string, unknown>) =>
    write("info", message, meta),
  warn: (message: string, meta?: Record<string, unknown>) =>
    write("warn", message, meta),
  error: (message: string, meta?: Record<string, unknown>) =>
    write("error", message, meta),
};
