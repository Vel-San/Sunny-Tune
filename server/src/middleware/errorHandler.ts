import { NextFunction, Request, Response } from "express";
import { logger } from "../lib/logger";

interface AppError extends Error {
  status?: number;
}

export function errorHandler(
  err: AppError,
  req: Request,
  res: Response,
  _next: NextFunction,
): void {
  const status = err.status ?? 500;

  // Always log 5xx errors with full detail; log 4xx at warn level
  if (status >= 500) {
    logger.error("Unhandled server error", {
      method: req.method,
      path: req.path,
      status,
      err: err.message,
      stack: process.env.NODE_ENV !== "production" ? err.stack : undefined,
    });
  } else {
    logger.warn("Request error", {
      method: req.method,
      path: req.path,
      status,
      err: err.message,
    });
  }

  const message =
    process.env.NODE_ENV === "production" && status === 500
      ? "Internal server error"
      : err.message;

  res.status(status).json({ error: message });
}
