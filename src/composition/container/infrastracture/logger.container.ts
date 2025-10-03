import { asFunction, AwilixContainer } from "awilix";

import {
  influxDbLoggerConfig,
  localFileConfig,
  loggerAdapterConfig,
} from "../../../configs/index.js";
import { createLoggerAdapter } from "../../../infrastructure/loggers/adapters/createLoggerAdapter/createLoggerAdapter.js";
import { createConsoleLogger } from "../../../infrastructure/loggers/createConsoleLogger/index.js";
import { createFallbackLogger } from "../../../infrastructure/loggers/createFallbackLogger/createFallbackLogger.js";
import { createInfluxDbLogger } from "../../../infrastructure/loggers/createInfluxdbLogger/createInfluxDbLogger.js";
import { createLocalFileLogger } from "../../../infrastructure/loggers/createLocalFileLogger/createLocalFileLogger.js";
import { Log } from "../../../infrastructure/types/Log.js";
import { Container } from "../../types/Container.js";

export const registerLogger = (container: AwilixContainer<Container>) => {
  container.register({
    loggerAdapter: asFunction(({ tracingContextManager }) => {
      const influxDbLogger = createInfluxDbLogger(influxDbLoggerConfig);
      const localFileLogger = createLocalFileLogger(localFileConfig);
      const consoleLogger = createConsoleLogger();

      const fallbackLogger = createFallbackLogger(
        {
          loggers: [influxDbLogger, localFileLogger, consoleLogger],
        },
        {
          onError: (details: Log, error: Error) => console.warn(details, error),
        },
      );

      return createLoggerAdapter(
        { logger: fallbackLogger, tracingContextManager },
        loggerAdapterConfig,
      );
    }).singleton(),
  });
};
