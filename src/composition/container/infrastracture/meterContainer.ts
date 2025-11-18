import { asFunction, AwilixContainer } from "awilix";

import { telemetryConfig } from "../../../configs/telemetryConfig.js";
import { createMeter } from "../../../infrastructure/telemetry/otel/metrics/createMeter/index.js";
import { Container } from "../../types/Container.js";

export const registerMeter = (container: AwilixContainer<Container>) => {
  container.register({
    meter: asFunction(() => {
      return createMeter({ serviceName: telemetryConfig.serviceName });
    }).singleton(),
  });
};
