import { z } from "zod";

import { LoggerAdapterConfig } from "../infrastructure/loggers/adapters/createLoggerAdapter/index.js";
import { EnvironmentType } from "../shared/enums/EnvironmentType.js";

const loggerAdapterConfigSchema = z.object({
  measurement: z.string().min(1, "measurement не может быть пустым"),
  serviceName: z.string().min(1, "serviceName не может быть пустым"),
  serviceVersion: z.string().min(1, "serviceVersion не может быть пустым"),
  environment: z.nativeEnum(EnvironmentType),
});

export const loggerAdapterConfig: LoggerAdapterConfig =
  loggerAdapterConfigSchema.parse({
    measurement: process.env.MEASUREMENT,
    serviceName: process.env.SERVICE_NAME,
    serviceVersion: process.env.SERVICE_VERSION,
    environment:
      process.env.NODE_ENV === "development"
        ? EnvironmentType.Development
        : EnvironmentType.Production,
  });
