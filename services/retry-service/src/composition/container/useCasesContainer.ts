import type { AwilixContainer } from "awilix";
import { asFunction } from "awilix";

import { createCheckHealthUseCase } from "../../application/useCases/createCheckHealthUseCase/index.js";
import type { Container } from "../types/index.js";

export const registerUseCases = (container: AwilixContainer<Container>) => {
  container.register({
    checkHealthUseCase: asFunction(
      ({ retryConsumer }) => {
        const checkNotificationServiceHealth = createCheckHealthUseCase({
          retryConsumer,
        });

        return checkNotificationServiceHealth;
      },
    ).singleton(),
  });
};
