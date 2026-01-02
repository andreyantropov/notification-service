import type { AwilixContainer } from "awilix";
import { asFunction } from "awilix";

import { createGenerator } from "../../infrastructure/generators/index.js";
import type { Container } from "../types/Container.js";

export const registerGenerator = (container: AwilixContainer<Container>) => {
  container.register({
    generator: asFunction(() => {
      const generator = createGenerator();

      return generator;
    }).singleton(),
  });
};
