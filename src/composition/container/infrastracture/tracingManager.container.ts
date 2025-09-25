import { AwilixContainer, asValue } from "awilix";

import { openTelemetryContextManager } from "../../../infrastructure/tracing/openTelemetryContextManager/index.js";
import { Container } from "../../types/Container.js";

export const registerTelemetry = (container: AwilixContainer<Container>) => {
  container.register({
    tracingContextManager: asValue(openTelemetryContextManager),
  });
};
