import { AwilixContainer, asFunction } from "awilix";

import { telemetryConfig } from "../../../configs/index.js";
import { createTracer } from "../../../infrastructure/telemetry/otel/tracing/createTracer/index.js";
import { Container } from "../../types/Container.js";

export const registerTracer = (container: AwilixContainer<Container>) => {
  container.register({
    tracer: asFunction(() => createTracer(telemetryConfig)).singleton(),
  });
};
