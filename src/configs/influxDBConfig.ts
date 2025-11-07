import { z } from "zod";

import { InfluxDBLoggerConfig } from "../infrastructure/telemetry/logging/createInfluxDBLogger/index.js";

const influxDBConfigSchema = z.object({
  url: z
    .string()
    .url(
      "Некорректный URL InfluxDB: должно быть валидным URL (например, http://localhost:8086)",
    ),
  token: z.string().min(1, "token не может быть пустым"),
  org: z.string().min(1, "org не может быть пустым"),
  bucket: z.string().min(1, "bucket не может быть пустым"),
  measurement: z.string().min(1, "measurement не может быть пустым"),
});

export const influxDBConfig: InfluxDBLoggerConfig = influxDBConfigSchema.parse({
  url: process.env.INFLUXDB_URL,
  token: process.env.INFLUXDB_TOKEN,
  org: process.env.INFLUXDB_ORG,
  bucket: process.env.INFLUXDB_BUCKET,
  measurement: process.env.INFLUXDB_MEASUREMENT,
});
