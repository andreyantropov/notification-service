import { type AwilixContainer, createContainer, InjectionMode } from "awilix";

import { type Container } from "./interfaces/Container.js";
import {
  registerApplication,
  registerEnv,
  registerHandlers,
  registerInfrastracture,
} from "./registrations/index.js";

export const initContainer = (): AwilixContainer<Container> => {
  const container = createContainer<Container>({
    injectionMode: InjectionMode.PROXY,
  });

  registerEnv(container);
  registerInfrastracture(container);
  registerApplication(container);
  registerHandlers(container);

  return container;
};
