import { createInfluxDbLogger } from "../../shared/infrastructure/loggers/influxdbLogger";
import { InfluxDbLoggerConfig } from "../../shared/infrastructure/loggers/influxdbLogger/interfaces/InfluxDbLoggerConfig";
import { LocalFileLoggerConfig } from "../../shared/infrastructure/loggers/localFileLogger/interfaces/LocalFileLoggerConfig";
import { Logger } from "../../shared/interfaces/Logger";
import { createLocalFileLogger } from "../../shared/infrastructure/loggers/localFileLogger";
import { createFallbackLogger } from "../../shared/infrastructure/loggers/fallbackLogger";
import { Log } from "../../shared/interfaces/Log";

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
