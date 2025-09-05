import { asFunction, AwilixContainer } from "awilix";
import { Container } from "../../types/Container.js";
import { createActiveRequestsCounter } from "../../../infrastructure/counters/createActiveRequestCounter/index.js";

export const registerCounter = (container: AwilixContainer<Container>) => {
  container.register({
    activeRequestsCounter: asFunction(createActiveRequestsCounter).singleton(),
  });
};
