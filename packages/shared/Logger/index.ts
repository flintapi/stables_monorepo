import { winstonLoggerOptions, winston } from "./winston.logger";


export const rampLogger = winston.loggers.add('ramp', {
  ...winstonLoggerOptions,
  defaultMeta: {
    service: "ramp"
  }
})
export const eventLogger = winston.loggers.add('event', {
  ...winstonLoggerOptions,
  defaultMeta: {
    service: "event"
  }
})

export const apiLogger = winston.loggers.add('api-gateway', {
  ...winstonLoggerOptions,
  defaultMeta: {
    service: "api-gateway"
  }
})
