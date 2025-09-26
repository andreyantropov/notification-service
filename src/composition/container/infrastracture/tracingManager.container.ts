import { AwilixContainer, asFunction } from "awilix";

import { createOtelTracingContextManager } from "../../../infrastructure/tracing/otel/createOtelTracingContextManager/index.js";
import { Container } from "../../types/Container.js";

export const registerTelemetry = (container: AwilixContainer<Container>) => {
  container.register({
    tracingContextManager: asFunction(() =>
      createOtelTracingContextManager(),
    ).singleton(),
  });
};
