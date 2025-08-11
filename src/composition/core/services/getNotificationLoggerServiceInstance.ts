import {
  createNotificationLoggerService,
  NotificationLoggerService,
} from "../../../application/services/createNotificationLoggerService/index.js";
import { influxDbLoggerConfig } from "../../../configs/influxdb.config.js";
import { localFileConfig } from "../../../configs/localFile.config.js";
import { createFallbackLogger } from "../../../shared/infrastructure/loggers/createFallbackLogger/index.js";
import { createInfluxDbLogger } from "../../../shared/infrastructure/loggers/createInfluxdbLogger/createInfluxDbLogger.js";
import { createLocalFileLogger } from "../../../shared/infrastructure/loggers/createLocalFileLogger/createLocalFileLogger.js";
import { Log } from "../../../shared/interfaces/Log.js";

let instance: NotificationLoggerService | null = null;

export const getNotificationLoggerServiceInstance =
  (): NotificationLoggerService => {
    if (instance === null) {
      const influxDbLogger = createInfluxDbLogger(influxDbLoggerConfig);
      const localFileLogger = createLocalFileLogger(localFileConfig);

      const fallbackLogger = createFallbackLogger(
        [influxDbLogger, localFileLogger],
        {
          onError: (payload: Log, error: Error) => console.warn(payload, error),
        },
      );

      instance = createNotificationLoggerService(fallbackLogger);
    }

    return instance;
  };
