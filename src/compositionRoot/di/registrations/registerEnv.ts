import { asValue, type AwilixContainer } from "awilix";

import { env } from "../../env.js";
import { type Container } from "../interfaces/Container.js";

export const registerEnv = (container: AwilixContainer<Container>) => {
  container.register({
    env: asValue(env),
  });
};
