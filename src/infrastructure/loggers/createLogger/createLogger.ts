import os from "os";

import { serializeError } from "serialize-error";
import { v4 } from "uuid";

import { LoggerDependencies } from "./interfaces/LoggerDependencies.js";
import { Logger } from "../../ports/Logger.js";
import { TelemetryConfig } from "../../telemetry/interfaces/TelemetryConfig.js";
import { LogLevel, TriggerType } from "../../telemetry/logging/index.js";
import { Log as InfrastractureLog } from "../../telemetry/logging/interfaces/Log.js";
import { Log } from "../../types/Log.js";

export const createLogger = (
  dependencies: LoggerDependencies,
  config: TelemetryConfig,
): Logger => {
  const { logger, tracingContextManager } = dependencies;
  const { serviceName, serviceVersion, environment } = config;

  const formatLog = (
    level: LogLevel,
    { eventType, message, duration, details, error }: Log,
  ): InfrastractureLog => {
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
      timestamp: Date.now(),
      level,
      serviceName,
      serviceVersion,
      trigger: TriggerType.Api,
      environment,
      eventType,
      host: os.hostname(),
      id: v4(),
      message,
      durationMs: duration || 0,
      traceId: traceCtx?.traceId,
      spanId: traceCtx?.spanId,
      details: safeStringify(details),
      error: processedError,
    };
  };

  const writeLog = async (level: LogLevel, log: Log): Promise<void> => {
    try {
      const infrastractureLog = formatLog(level, log);
      await logger.writeLog(infrastractureLog);
    } catch (error) {
      console.error("Не удалось записать лог в систему:", {
        originalLog: log,
        loggingError: error,
      });
    }
  };

  return {
    debug: async (log) => await writeLog(LogLevel.Debug, log),
    info: async (log) => await writeLog(LogLevel.Info, log),
    warning: async (log) => await writeLog(LogLevel.Warning, log),
    error: async (log) => await writeLog(LogLevel.Error, log),
    critical: async (log) => await writeLog(LogLevel.Critical, log),
  };
};
