import { asFunction, AwilixContainer } from "awilix";

import { createInMemoryBuffer } from "../../../infrastructure/buffers/createInMemoryBuffer/index.js";
import { Container } from "../../types/Container.js";

export const registerBuffer = (container: AwilixContainer<Container>) => {
  container.register({
    buffer: asFunction(() => createInMemoryBuffer()).singleton(),
  });
};
