import {
  createNotificationLoggerService,
  NotificationLoggerService,
} from "../../application/services/notificationLoggerService/index.js";
import { influxDbLoggerConfig } from "../../configs/influxdb.config.js";
import { localFileConfig } from "../../configs/localFile.config.js";
import { createFallbackLogger } from "../../shared/infrastructure/loggers/fallbackLogger/fallbackLogger.js";
import { createInfluxDbLogger } from "../../shared/infrastructure/loggers/influxdbLogger/influxDbLogger.js";
import { createLocalFileLogger } from "../../shared/infrastructure/loggers/localFileLogger/localFileLogger.js";
import { Log } from "../../shared/interfaces/Log.js";

export const createDefaultNotificationLoggerService =
  (): NotificationLoggerService => {
    const influxDbLogger = createInfluxDbLogger(influxDbLoggerConfig);
    const localFileLogger = createLocalFileLogger(localFileConfig);

    const fallbackLogger = createFallbackLogger({
      loggers: [influxDbLogger, localFileLogger],
      onError: (payload: Log, error: Error) => console.warn(payload, error),
    });

    const notificationLoggerService = createNotificationLoggerService({
      logger: fallbackLogger,
    });

    return notificationLoggerService;
  };
