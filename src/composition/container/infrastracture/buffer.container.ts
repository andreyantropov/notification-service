import { asFunction, AwilixContainer } from "awilix";
import { Container } from "../../types/Container.js";
import { createInMemoryBuffer } from "../../../infrastructure/buffers/createInMemoryBuffer/index.js";

export const registerBuffer = (container: AwilixContainer<Container>) => {
  container.register({
    buffer: asFunction(() => createInMemoryBuffer()).singleton(),
  });
};
