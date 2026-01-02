import type { AwilixContainer } from "awilix";
import { asFunction } from "awilix";

import { serviceConfig } from "../../configs/index.js";
import {
  createLogger,
  createMeter,
  createTracer,
} from "../../infrastructure/telemetry/index.js";
import type { Container } from "../types/Container.js";

export const registerTelemetry = (container: AwilixContainer<Container>) => {
  container.register({
    logger: asFunction(() => {
      const logger = createLogger();

      return logger;
    }).singleton(),
    tracer: asFunction(() => {
      const { name } = serviceConfig;

      const tracer = createTracer({ serviceName: name });

      return tracer;
    }).singleton(),
    meter: asFunction(() => {
      const { name } = serviceConfig;

      const meter = createMeter({ serviceName: name });

      return meter;
    }).singleton(),
  });
};
