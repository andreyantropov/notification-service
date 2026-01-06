import type { AwilixContainer } from "awilix";
import { asFunction } from "awilix";

import { serviceConfig } from "../../configs/index.js";
import {
  createLogger,
  createMeter,
} from "@notification-platform/telemetry";
import type { Container } from "../types/Container.js";

export const registerTelemetry = (container: AwilixContainer<Container>) => {
  container.register({
    logger: asFunction(() => {
      const logger = createLogger();

      return logger;
    }).singleton(),
    meter: asFunction(() => {
      const { name } = serviceConfig;

      const meter = createMeter({ serviceName: name });

      return meter;
    }).singleton(),
  });
};
