import { initContainer } from "../di/index.js";

import { type App } from "./interfaces/index.js";

export const createApp = (): App => {
  const container = initContainer();

  const start = async (): Promise<void> => {
    const { server } = container.cradle;
    await server.start();
  };

  const shutdown = async (): Promise<void> => {
    const { server } = container.cradle;
    await server.shutdown();
  };

  return {
    start,
    shutdown,
  };
};
