import { AwilixContainer, asFunction } from "awilix";

import { createGenerator } from "../../infrastructure/generators/index.js";
import { Container } from "../types/Container.js";

export const registerGenerator = (container: AwilixContainer<Container>) => {
  container.register({
    generator: asFunction(() => {
      const generator = createGenerator();

      return generator;
    }).singleton(),
  });
};
