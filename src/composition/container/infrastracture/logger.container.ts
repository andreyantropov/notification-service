import { asFunction, AwilixContainer } from "awilix";
import { createInfluxDbLogger } from "../../../infrastructure/loggers/createInfluxdbLogger/createInfluxDbLogger.js";
import { createLocalFileLogger } from "../../../infrastructure/loggers/createLocalFileLogger/createLocalFileLogger.js";
import { createFallbackLogger } from "../../../infrastructure/loggers/createFallbackLogger/createFallbackLogger.js";
import { createLoggerAdapter } from "../../../infrastructure/loggers/adapters/createLoggerAdapter/createLoggerAdapter.js";
import { Container } from "../../types/Container.js";
import { Log } from "../../../infrastructure/types/Log.js";
import {
  influxDbLoggerConfig,
  localFileConfig,
  loggerAdapterConfig,
} from "../../../configs/index.js";

export const registerLogger = (container: AwilixContainer<Container>) => {
  container.register({
    loggerAdapter: asFunction(() => {
      const influxDbLogger = createInfluxDbLogger(influxDbLoggerConfig);
      const localFileLogger = createLocalFileLogger(localFileConfig);

      const fallbackLogger = createFallbackLogger(
        [influxDbLogger, localFileLogger],
        {
          onError: (payload: Log, error: Error) => console.warn(payload, error),
        },
      );

      return createLoggerAdapter(fallbackLogger, loggerAdapterConfig);
    }).singleton(),
  });
};
