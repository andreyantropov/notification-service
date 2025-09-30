import { AwilixContainer, asFunction } from "awilix";

import { loggerAdapterConfig } from "../../../configs/index.js";
import { createTracingContextManager } from "../../../infrastructure/telemetry/otel/createTracingContextManager/index.js";
import { Container } from "../../types/Container.js";

export const registerTelemetry = (container: AwilixContainer<Container>) => {
  container.register({
    tracingContextManager: asFunction(() =>
      createTracingContextManager(loggerAdapterConfig),
    ).singleton(),
  });
};
