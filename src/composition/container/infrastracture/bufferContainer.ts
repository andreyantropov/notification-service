import { asFunction, AwilixContainer } from "awilix";

import { Notification } from "../../../domain/types/Notification.js";
import {
  createInMemoryBuffer,
  createTracedBuffer,
  createLoggedBuffer,
} from "../../../infrastructure/buffers/index.js";
import { Container } from "../../types/Container.js";

export const registerBuffer = (container: AwilixContainer<Container>) => {
  container.register({
    buffer: asFunction(({ tracingContextManager, logger }) => {
      const buffer = createInMemoryBuffer<Notification>();
      const tracedBuffer = createTracedBuffer<Notification>({
        buffer,
        tracingContextManager,
      });
      const loggedTracedBuffer = createLoggedBuffer<Notification>({
        buffer: tracedBuffer,
        logger,
      });

      return loggedTracedBuffer;
    }).singleton(),
  });
};
