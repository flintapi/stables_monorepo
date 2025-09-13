import { pinoLogger as logger } from "hono-pino";
import pino from "pino";
import pretty from "pino-pretty";

import env from "@/env";

export function pinoLogger() {
  return logger({
    pino: pino({
      level: env.LOG_LEVEL || "info",
    }, env.NODE_ENV === "production" ? undefined : pretty({
      colorize: true,
      messageFormat(log) {
        return `[${(log?.req as { method: string })?.method}] ${(log?.req as { url: string })?.url} - ${(log?.res as { status: number })?.status}`
      },
      ignore: env.NODE_ENV !== "development" ? 'pid,hostname,res,req,reqId,responseTime' : undefined
    })),
  });
}
