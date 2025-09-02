import { z } from "zod";
import { InfluxDbLoggerConfig } from "../infrastructure/loggers/createInfluxdbLogger/index.js";

const influxDbConfigSchema = z.object({
  url: z.string().url("Некорректный URL InfluxDB").min(1),
  token: z.string().min(1, "Токен InfluxDB обязателен"),
  org: z.string().min(1, "Организация InfluxDB обязательна"),
  bucket: z.string().min(1, "Бакет InfluxDB обязателен"),
});

export const influxDbLoggerConfig: InfluxDbLoggerConfig =
  influxDbConfigSchema.parse({
    url: process.env.INFLUXDB_URL,
    token: process.env.INFLUXDB_TOKEN,
    org: process.env.INFLUXDB_ORG,
    bucket: process.env.INFLUXDB_BUCKET,
  });
