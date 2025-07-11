import { Log } from "../../../../interfaces/Log.js";
import { InfluxDbLoggerConfig } from "../../../loggers/influxdbLogger/interfaces/InfluxDbLoggerConfig.js";
import { LocalFileLoggerConfig } from "../../../loggers/localFileLogger/interfaces/LocalFileLoggerConfig.js";

export interface LoggerFabricConfig {
  influxDbLoggerConfig: InfluxDbLoggerConfig;
  localFileLoggerConfig: LocalFileLoggerConfig;
  onError?: (payload: Log, error: Error) => void;
}
