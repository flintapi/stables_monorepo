import { pinoLogger as logger } from "hono-pino";
import pino from "pino";
import pretty from "pino-pretty";
import env from "../utils/env";

export function pinoLogger(logLevel?: string) {
  return logger({
    pino: pino({
      level: logLevel || env.LOG_LEVEL || "info",
    }, env.NODE_ENV === "production" ? undefined : pretty()),
  });
}
