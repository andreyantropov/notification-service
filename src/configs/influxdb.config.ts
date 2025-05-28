import { InfluxDbLoggerConfig } from "../shared/infrastructure/loggers/influxdbLogger/interfaces/InfluxDbLoggerConfig";

export const influxDbLoggerConfig: InfluxDbLoggerConfig = {
  url: process.env.INFLUXDB_URL,
  token: process.env.INFLUXDB_TOKEN,
  org: process.env.INFLUXDB_ORG,
  bucket: process.env.INFLUXDB_BUCKET,
};
