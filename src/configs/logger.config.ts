import { z } from "zod";
import { LoggerAdapterConfig } from "../infrastructure/loggers/adapters/createLoggerAdapter/index.js";
import { EnvironmentType } from "../shared/enums/EnvironmentType.js";

const loggerAdapterConfigSchema = z.object({
  measurement: z.string().min(1, "measurement не может быть пустым"),
  currentService: z.string().min(1, "currentService не может быть пустым"),
  environment: z.nativeEnum(EnvironmentType),
});

export const loggerAdapterConfig: LoggerAdapterConfig =
  loggerAdapterConfigSchema.parse({
    measurement: process.env.MEASUREMENT,
    currentService: process.env.CURRENT_SERVICE,
    environment:
      process.env.NODE_ENV === "development"
        ? EnvironmentType.Development
        : EnvironmentType.Production,
  });
