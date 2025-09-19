import os from "os";

import { serializeError } from "serialize-error";
import { v4 } from "uuid";

import { LoggerAdapterConfig } from "./interfaces/LoggerAdapterConfig.js";
import { LoggerAdapterDependencies } from "./interfaces/LoggerAdapterDependencies.js";
import { LoggerAdapter } from "../../../../application/ports/LoggerAdapter.js";
import { RawLog } from "../../../../application/types/RawLog.js";
import { TriggerType } from "../../../../shared/enums/TriggerType.js";
import { Log } from "../../../types/Log.js";

export const createLoggerAdapter = (
  dependencies: LoggerAdapterDependencies,
  config: LoggerAdapterConfig,
): LoggerAdapter => {
  const { logger } = dependencies;
  const { measurement, currentService, environment } = config;

  const formatLog = ({
    level,
    eventType,
    spanId,
    message,
    duration,
    payload,
    error,
  }: RawLog): Log => {
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
        level: level,
        currentService,
        trigger: TriggerType.Api,
        environment,
        eventType: eventType,
        host: os.hostname(),
        spanId: spanId,
      },
      fields: {
        id: v4(),
        message: message,
        durationMs: duration || 0,
        payload: safeStringify(payload),
        error: processedError,
      },
    };
  };

  const writeLog = async (rawLog: RawLog): Promise<void> => {
    try {
      const log = formatLog(rawLog);
      await logger.writeLog(log);
    } catch (error) {
      console.error("Не удалось записать лог в систему:", {
        originalLog: rawLog,
        loggingError: error,
      });
    }
  };

  return {
    writeLog,
  };
};
