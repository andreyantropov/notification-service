import z from "zod";

import { TelemetryConfig } from "../composition/telemetry/index.js";

const telemetryConfigSchema = z.object({
  tracesExporterUrl: z
    .string()
    .trim()
    .url(
      "tracesExporterUrl должен быть валидным URL (например, http://otel-collector:4318/v1/traces)",
    ),
  logsExporterUrl: z
    .string()
    .trim()
    .url(
      "logsExporterUrl должен быть валидным URL (например, http://otel-collector:4318/v1/logs)",
    ),
  metricsExporterUrl: z
    .string()
    .trim()
    .url(
      "metricsExporterUrl должен быть валидным URL (например, http://otel-collector:4318/v1/metrics)",
    ),
});

export const telemetryConfig: TelemetryConfig = telemetryConfigSchema.parse({
  tracesExporterUrl: process.env.TELEMETRY_TRACES_EXPORTER_URL,
  logsExporterUrl: process.env.TELEMETRY_LOGS_EXPORTER_URL,
  metricsExporterUrl: process.env.TELEMETRY_METRICS_EXPORTER_URL,
});
