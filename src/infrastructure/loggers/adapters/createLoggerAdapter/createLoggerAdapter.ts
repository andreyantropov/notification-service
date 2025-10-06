import os from "os";

import { serializeError } from "serialize-error";
import { v4 } from "uuid";

import { LoggerAdapterConfig } from "./interfaces/LoggerAdapterConfig.js";
import { LoggerAdapterDependencies } from "./interfaces/LoggerAdapterDependencies.js";
import { LogLevel } from "../../../../shared/enums/LogLevel.js";
import { TriggerType } from "../../../../shared/enums/TriggerType.js";
import { LoggerAdapter } from "../../../ports/LoggerAdapter.js";
import { Log } from "../../../types/Log.js";
import { RawLog } from "../../../types/RawLog.js";

export const createLoggerAdapter = (
  dependencies: LoggerAdapterDependencies,
  config: LoggerAdapterConfig,
): LoggerAdapter => {
  const { logger, tracingContextManager } = dependencies;
  const { measurement, serviceName, serviceVersion, environment } = config;

  const formatLog = (
    level: LogLevel,
    { eventType, message, duration, details, error }: RawLog,
  ): Log => {
    const activeCtx = tracingContextManager.active();
    const traceCtx = tracingContextManager.getTraceContext(activeCtx);

    const safeStringify = (data: unknown): string | undefined => {
      try {
        return typeof data === "string" ? data : JSON.stringify(data);
      } catch {
        return undefined;
      }
    };

    const processedError = error
      ? safeStringify(serializeError(error))
      : undefined;

    return {
      measurement: measurement,
      timestamp: Date.now() * 1_000_000,
      tags: {
        level,
        serviceName,
        serviceVersion,
        trigger: TriggerType.Api,
        environment,
        eventType,
        host: os.hostname(),
      },
      fields: {
        id: v4(),
        message,
        durationMs: duration || 0,
        traceId: traceCtx?.traceId,
        spanId: traceCtx?.spanId,
        details: safeStringify(details),
        error: processedError,
      },
    };
  };

  const writeLog = async (level: LogLevel, rawLog: RawLog): Promise<void> => {
    try {
      const log = formatLog(level, rawLog);
      await logger.writeLog(log);
    } catch (error) {
      console.error("Не удалось записать лог в систему:", {
        originalLog: rawLog,
        loggingError: error,
      });
    }
  };

  return {
    debug: async (rawLog) => await writeLog(LogLevel.Debug, rawLog),
    info: async (rawLog) => await writeLog(LogLevel.Info, rawLog),
    warning: async (rawLog) => await writeLog(LogLevel.Warning, rawLog),
    error: async (rawLog) => await writeLog(LogLevel.Error, rawLog),
    critical: async (rawLog) => await writeLog(LogLevel.Critical, rawLog),
  };
};
