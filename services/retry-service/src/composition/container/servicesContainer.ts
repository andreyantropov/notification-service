import type { AwilixContainer } from "awilix";
import { asFunction } from "awilix";

import {
  createLoggedRetryService,
  createMeteredRetryService,
  createRetryService,
} from "../../application/services/createRetryService/index.js";
import type { Container } from "../types/index.js";

export const registerServices = (container: AwilixContainer<Container>) => {
  container.register({
    retryService: asFunction(({ logger, meter }) => {
      const retryService = createRetryService();
      const loggedRetryService = createLoggedRetryService({
        retryService,
        logger,
      });
      const meteredLoggedRetryService = createMeteredRetryService({
        retryService: loggedRetryService,
        meter,
      });

      return meteredLoggedRetryService;
    }).singleton(),
  });
};
