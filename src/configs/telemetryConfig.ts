import { z } from "zod";

import { EnvironmentType } from "../application/enums/EnvironmentType.js";
import { SDKConfig } from "../composition/telemetry/sdk/index.js";

const telemetryConfigSchema = z.object({
  serviceName: z.string().min(1, "serviceName не может быть пустым"),
  serviceVersion: z.string().min(1, "serviceVersion не может быть пустым"),
  environment: z.nativeEnum(EnvironmentType),
  port: z.coerce.number().int().positive().default(3000),
  otelTracesUrl: z
    .string()
    .url(
      "Некорректный URL OTel Collector: otelTracesUrl должен быть валидным URL (например, http://otel-collector:4318/v1/traces)",
    ),
  otelLogsUrl: z
    .string()
    .url(
      "Некорректный URL OTel Collector: otelLogsUrl должен быть валидным URL (например, http://otel-collector:4318/v1/logs)",
    ),
  otelMetricsUrl: z
    .string()
    .url(
      "Некорректный URL OTel Collector: otelMetricsUrl должен быть валидным URL (например, http://otel-collector:4318/v1/metrics)",
    ),
});

export const telemetryConfig: SDKConfig = telemetryConfigSchema.parse({
  serviceName: process.env.SERVICE_NAME,
  serviceVersion: process.env.SERVICE_VERSION,
  environment:
    process.env.NODE_ENV === "development"
      ? EnvironmentType.Development
      : EnvironmentType.Production,
  port: process.env.PORT,
  otelTracesUrl: process.env.OTEL_TRACES_URL,
  otelLogsUrl: process.env.OTEL_LOGS_URL,
  otelMetricsUrl: process.env.OTEL_METRICS_URL,
});
