import { createInfluxDbLogger } from "../../shared/infrastructure/loggers/influxdbLogger/index.js";
import { InfluxDbLoggerConfig } from "../../shared/infrastructure/loggers/influxdbLogger/interfaces/InfluxDbLoggerConfig.js";
import { LocalFileLoggerConfig } from "../../shared/infrastructure/loggers/localFileLogger/interfaces/LocalFileLoggerConfig.js";
import { Logger } from "../../shared/interfaces/Logger.js";
import { createLocalFileLogger } from "../../shared/infrastructure/loggers/localFileLogger/index.js";
import { createFallbackLogger } from "../../shared/infrastructure/loggers/fallbackLogger/index.js";
import { Log } from "../../shared/interfaces/Log.js";

export const createDefaultLogger = (
  influxDbLoggerConfig: InfluxDbLoggerConfig,
  localFileLoggerConfig: LocalFileLoggerConfig,
  onError?: (payload: Log, error: Error) => void,
): Logger => {
  const loggers = [
    createInfluxDbLogger(influxDbLoggerConfig),
    createLocalFileLogger(localFileLoggerConfig),
  ];

  return createFallbackLogger({ loggers, onError });
};
