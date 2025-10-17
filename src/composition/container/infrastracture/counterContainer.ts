import { asFunction, AwilixContainer } from "awilix";

import { createCounter } from "../../../infrastructure/counters/createCounter/index.js";
import { Container } from "../../types/Container.js";

export const registerCounter = (container: AwilixContainer<Container>) => {
  container.register({
    activeRequestsCounter: asFunction(createCounter).singleton(),
  });
};
