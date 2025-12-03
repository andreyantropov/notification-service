import { OpenTelemetryTransportV3 } from "@opentelemetry/winston-transport";
import { serializeError } from "serialize-error";
import { v4 } from "uuid";
import winston from "winston";

import { LogLevel, TriggerType } from "../../../application/enums/index.js";
import { Logger } from "../../../application/ports/index.js";
import { Log } from "../../../application/types/index.js";
import { mapKeysToSnakeCase } from "../../../shared/utils/index.js";

export const createLogger = (): Logger => {
  const logLevels = {
    critical: 0,
    error: 1,
    warn: 2,
    info: 3,
    debug: 4,
  } as const;

  winston.addColors({
    critical: "red",
    error: "red",
    warn: "yellow",
    info: "green",
    debug: "blue",
  });

  const levelMap: Record<LogLevel, keyof typeof logLevels> = {
    [LogLevel.Critical]: "critical",
    [LogLevel.Error]: "error",
    [LogLevel.Warning]: "warn",
    [LogLevel.Info]: "info",
    [LogLevel.Debug]: "debug",
  };

  const winstonLogger = winston.createLogger({
    levels: logLevels,
    transports: [new OpenTelemetryTransportV3({})],
  });

  const prepareMeta = ({ eventType, duration, details, error }: Log) => {
    const meta = {
      id: v4(),
      trigger: TriggerType.Api,
      event_type: eventType,
      duration: duration || 0,
      ...(details ? mapKeysToSnakeCase(details) : undefined),
      ...(error ? mapKeysToSnakeCase(serializeError(error)) : undefined),
    };
    return meta;
  };

  const writeLog = (level: LogLevel, logData: Log): Promise<void> => {
    const winstonLevel = levelMap[level];
    const meta = prepareMeta(logData);
    winstonLogger.log(winstonLevel, logData.message, meta);
    return Promise.resolve();
  };

  return {
    debug: (log) => writeLog(LogLevel.Debug, log),
    info: (log) => writeLog(LogLevel.Info, log),
    warning: (log) => writeLog(LogLevel.Warning, log),
    error: (log) => writeLog(LogLevel.Error, log),
    critical: (log) => writeLog(LogLevel.Critical, log),
  };
};
