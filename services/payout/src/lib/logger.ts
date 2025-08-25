import env from "@/env"
import winston from "winston"


export const logger = winston.createLogger({
  level: env.LOG_LEVEL || 'info',
  format: winston.format.json(),
  defaultMeta: { service: 'payout-service' },
  transports: [
    new winston.transports.Console()
  ]
})
