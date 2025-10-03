import { asFunction, AwilixContainer } from "awilix";

import { Notification } from "../../../domain/types/Notification.js";
import { createInMemoryBuffer } from "../../../infrastructure/buffers/createInMemoryBuffer/index.js";
import { createLoggedBuffer } from "../../../infrastructure/buffers/decorators/createLoggedBuffer/index.js";
import { createTracedBuffer } from "../../../infrastructure/buffers/decorators/createTracedBuffer/index.js";
import { Container } from "../../types/Container.js";

export const registerBuffer = (container: AwilixContainer<Container>) => {
  container.register({
    buffer: asFunction(({ tracingContextManager, loggerAdapter }) => {
      const buffer = createInMemoryBuffer<Notification>();
      const tracedBuffer = createTracedBuffer<Notification>({
        buffer,
        tracingContextManager,
      });
      const loggedTracedBuffer = createLoggedBuffer<Notification>({
        buffer: tracedBuffer,
        loggerAdapter,
      });

      return loggedTracedBuffer;
    }).singleton(),
  });
};
