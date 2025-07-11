import { Logger } from "../../../interfaces/Logger.js";
import { createFallbackLogger } from "../../loggers/fallbackLogger/fallbackLogger.js";
import { createInfluxDbLogger } from "../../loggers/influxdbLogger/influxDbLogger.js";
import { createLocalFileLogger } from "../../loggers/localFileLogger/localFileLogger.js";
import { LoggerFabricConfig } from "./interfaces/LoggerFabricConfig.js";

export const createDefaultLogger = ({
  influxDbLoggerConfig,
  localFileLoggerConfig,
  onError = () => {},
}: LoggerFabricConfig): Logger => {
  const loggers = [
    createInfluxDbLogger(influxDbLoggerConfig),
    createLocalFileLogger(localFileLoggerConfig),
  ];

  return createFallbackLogger({ loggers, onError });
};
