import winston from "winston";
import { Logtail } from "@logtail/node";
import { LogtailTransport } from "@logtail/winston";

const { colorize, combine, timestamp, align, errors, splat } = winston.format;

const logtail = new Logtail(process.env.BETTER_STACK_TOKEN_ID!, {
  endpoint: `https://${process.env.BETTER_STACK_INGESTION_HOST}`,
});

export const winstonLoggerOptions = {
  level: process.env.LOG_LEVEL || "debug",
  format:
    process.env.NODE_ENV === "development"
      ? combine(
          errors({ stack: true }),
          timestamp({
            format: "YYYY-MM-DD hh:mm:ss.SSS A", // 2022-01-25 03:23:10.350 PM
          }),
          colorize(),
          align(),
          // winston.format.json(),
          winston.format.printf((info) => {
            return (
              `${info.timestamp} - ${info.level}: ${info.message}\n` +
              JSON.stringify(
                Object.fromEntries(
                  Object.entries(info).filter(
                    ([k]) => !["level", "message", "timestamp"].includes(k),
                  ),
                ),
                (k, v) => (typeof v === "bigint" ? v.toString() : v),
                2,
              )
            );
          }),
        )
      : combine(
          errors({ stack: true }),
          timestamp({
            format: "YYYY-MM-DD hh:mm:ss.SSS A", // 2022-01-25 03:23:10.350 PM
          }),
          colorize(),
          align(),
          winston.format.json(),
          // winston.format.printf(info => `${info.timestamp} - ${info.level}: ${info.message}`)
        ),
  transports: [
    new winston.transports.Console(),
    new LogtailTransport(logtail, {
      silent: process.env.NODE_ENV === "development",
    }),
  ],
  exceptionHandlers: [
    new winston.transports.Console(),
    new LogtailTransport(logtail, {
      silent: process.env.NODE_ENV === "development",
    }),
  ],
  rejectionHandlers: [
    new winston.transports.Console(),
    new LogtailTransport(logtail, {
      silent: process.env.NODE_ENV === "development",
    }),
  ],
  exitOnError: false,
} satisfies winston.LoggerOptions;

export { winston };
