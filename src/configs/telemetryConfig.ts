import { z } from "zod";

import { TelemetryConfig } from "../infrastructure/loggers/createLogger/index.js";
import { EnvironmentType } from "../infrastructure/telemetry/logging/enums/EnvironmentType.js";

const telemetryConfigSchema = z.object({
  serviceName: z.string().min(1, "serviceName не может быть пустым"),
  serviceVersion: z.string().min(1, "serviceVersion не может быть пустым"),
  environment: z.nativeEnum(EnvironmentType),
});

export const telemetryConfig: TelemetryConfig = telemetryConfigSchema.parse({
  serviceName: process.env.SERVICE_NAME,
  serviceVersion: process.env.SERVICE_VERSION,
  environment:
    process.env.NODE_ENV === "development"
      ? EnvironmentType.Development
      : EnvironmentType.Production,
});
