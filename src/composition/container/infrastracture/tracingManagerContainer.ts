import { AwilixContainer, asFunction } from "awilix";

import { telemetryConfig } from "../../../configs/index.js";
import { createTracingContextManager } from "../../../infrastructure/telemetry/tracing/otel/createTracingContextManager/index.js";
import { Container } from "../../types/Container.js";

export const registerTelemetry = (container: AwilixContainer<Container>) => {
  container.register({
    tracingContextManager: asFunction(() =>
      createTracingContextManager(telemetryConfig),
    ).singleton(),
  });
};
