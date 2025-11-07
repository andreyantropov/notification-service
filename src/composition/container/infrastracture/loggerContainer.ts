import { asFunction, AwilixContainer } from "awilix";

import {
  influxDBConfig,
  localFileConfig,
  telemetryConfig,
} from "../../../configs/index.js";
import { createLogger } from "../../../infrastructure/loggers/createLogger/createLogger.js";
import {
  createInfluxDBLogger,
  createFileLogger,
  createConsoleLogger,
  createFallbackLogger,
} from "../../../infrastructure/telemetry/logging/index.js";
import { Log } from "../../../infrastructure/types/Log.js";
import { Container } from "../../types/Container.js";

export const registerLogger = (container: AwilixContainer<Container>) => {
  container.register({
    logger: asFunction(({ tracingContextManager }) => {
      const influxDBLogger = createInfluxDBLogger(influxDBConfig);
      const localFileLogger = createFileLogger(localFileConfig);
      const consoleLogger = createConsoleLogger();

      const fallbackLogger = createFallbackLogger(
        {
          loggers: [influxDBLogger, localFileLogger, consoleLogger],
        },
        {
          onError: (details: Log, error: Error) => console.warn(details, error),
        },
      );

      return createLogger(
        { logger: fallbackLogger, tracingContextManager },
        telemetryConfig,
      );
    }).singleton(),
  });
};
