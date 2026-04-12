import { OpenTelemetryTransportV3 } from "@opentelemetry/winston-transport";
import { serializeError } from "serialize-error";
import winston from "winston";

import { mapKeysToSnakeCase } from "../utils/index.js";

import { type Log, type Logger } from "./interfaces/index.js";
import { type LoggerConfig } from "./interfaces/LoggerConfig.js";
import {
  LOG_LEVEL,
  type LogLevel,
  WINSTON_SEVERITY_LEVEL_TYPE,
} from "./types/index.js";

export const createLogger = (config?: LoggerConfig): Logger => {
  const { level = LOG_LEVEL.INFO } = config ?? {};

  const winstonLogger = winston.createLogger({
    level,
    levels: {
      ...winston.config.npm.levels,
      fatal: WINSTON_SEVERITY_LEVEL_TYPE.ERROR,
      trace: WINSTON_SEVERITY_LEVEL_TYPE.SILLY,
    },
    transports: [new OpenTelemetryTransportV3({})],
  });

  const formatMetadata = ({
    eventType,
    trigger,
    durationMs,
    details,
    error,
  }: Log) => {
    const meta = {
      trigger,
      event_type: eventType,
      duration_ms: durationMs || 0,
      ...(details ? mapKeysToSnakeCase(details) : {}),
      ...(error ? mapKeysToSnakeCase(serializeError(error)) : {}),
    };
    return meta;
  };

  const writeLog = async (level: LogLevel, log: Log): Promise<void> => {
    winstonLogger.log(level, log.message, {
      eventName: log.eventName,
      ...formatMetadata(log),
    });
  };

  return {
    trace: (log: Log) => writeLog(LOG_LEVEL.TRACE, log),
    debug: (log: Log) => writeLog(LOG_LEVEL.DEBUG, log),
    info: (log: Log) => writeLog(LOG_LEVEL.INFO, log),
    warn: (log: Log) => writeLog(LOG_LEVEL.WARN, log),
    error: (log: Log) => writeLog(LOG_LEVEL.ERROR, log),
    fatal: (log: Log) => writeLog(LOG_LEVEL.FATAL, log),
  };
};
