import { asFunction, AwilixContainer } from "awilix";

import { createLogger } from "../../../infrastructure/telemetry/otel/logging/createLogger/createLogger.js";
import { Container } from "../../types/Container.js";

export const registerLogger = (container: AwilixContainer<Container>) => {
  container.register({
    logger: asFunction(() => {
      return createLogger();
    }).singleton(),
  });
};
