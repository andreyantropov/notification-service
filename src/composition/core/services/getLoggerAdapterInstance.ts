import { Log } from "../../../application/ports/Log.js";
import { LoggerAdapter } from "../../../application/ports/LoggerAdapter.js";
import { influxDbLoggerConfig } from "../../../configs/influxdb.config.js";
import { localFileConfig } from "../../../configs/localFile.config.js";
import { createLoggerAdapter } from "../../../infrastructure/loggers/adapters/createLoggerAdapter/createLoggerAdapter.js";
import { createFallbackLogger } from "../../../infrastructure/loggers/createFallbackLogger/createFallbackLogger.js";
import { createInfluxDbLogger } from "../../../infrastructure/loggers/createInfluxdbLogger/createInfluxDbLogger.js";
import { createLocalFileLogger } from "../../../infrastructure/loggers/createLocalFileLogger/createLocalFileLogger.js";

let instance: LoggerAdapter | null = null;

export const getLoggerAdapterInstance = (): LoggerAdapter => {
  if (instance === null) {
    const influxDbLogger = createInfluxDbLogger(influxDbLoggerConfig);
    const localFileLogger = createLocalFileLogger(localFileConfig);

    const fallbackLogger = createFallbackLogger(
      [influxDbLogger, localFileLogger],
      {
        onError: (payload: Log, error: Error) => console.warn(payload, error),
      },
    );

    instance = createLoggerAdapter(fallbackLogger);
  }

  return instance;
};
