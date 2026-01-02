import z from "zod";

import type { TelemetryConfig } from "../composition/telemetry/index.js";

const schema = z.object({
  tracesExporterUrl: z
    .string()
    .trim()
    .url(
      "tracesExporterUrl должен быть валидным URL (например, http://otel-collector:4318/v1/traces)",
    )
    .optional(),
  logsExporterUrl: z
    .string()
    .trim()
    .url(
      "logsExporterUrl должен быть валидным URL (например, http://otel-collector:4318/v1/logs)",
    )
    .optional(),
  metricsExporterUrl: z
    .string()
    .trim()
    .url(
      "metricsExporterUrl должен быть валидным URL (например, http://otel-collector:4318/v1/metrics)",
    )
    .optional(),
});

const rawEnv = {
  tracesExporterUrl: process.env.TELEMETRY_TRACES_EXPORTER_URL,
  logsExporterUrl: process.env.TELEMETRY_LOGS_EXPORTER_URL,
  metricsExporterUrl: process.env.TELEMETRY_METRICS_EXPORTER_URL,
};

export const telemetryConfig: TelemetryConfig = schema.parse(rawEnv);
