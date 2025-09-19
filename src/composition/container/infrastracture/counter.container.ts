import { asFunction, AwilixContainer } from "awilix";

import { createActiveRequestsCounter } from "../../../infrastructure/counters/createActiveRequestCounter/index.js";
import { Container } from "../../types/Container.js";

export const registerCounter = (container: AwilixContainer<Container>) => {
  container.register({
    activeRequestsCounter: asFunction(createActiveRequestsCounter).singleton(),
  });
};
