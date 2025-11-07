import { ServerConfig } from "./interfaces/ServerConfig.js";
import { ServerDependencies } from "./interfaces/ServerDependencies.js";
import { Server } from "../../interfaces/Server.js";

const CHECK_ACTIVE_REQUESTS_INTERVAL = 100;

export const createServer = (
  dependencies: ServerDependencies,
  config: ServerConfig,
): Server => {
  const { app, activeRequestsCounter } = dependencies;
  const { port } = config;

  let server: ReturnType<typeof app.listen> | null = null;
  let isStarting = false;
  let isShuttingDown = false;

  const start = (): Promise<void> => {
    if (isStarting || isShuttingDown || server) {
      return Promise.resolve();
    }

    isStarting = true;

    return new Promise((resolve, reject) => {
      server = app.listen(port, () => {
        isStarting = false;
        resolve();
      });

      server.on("error", (error) => {
        isStarting = false;
        reject(error);
      });
    });
  };

  const shutdown = async (): Promise<void> => {
    if (isStarting || isShuttingDown || !server) {
      return;
    }

    const serverToClose = server;
    isShuttingDown = true;

    while (activeRequestsCounter.value > 0) {
      await new Promise((resolve) =>
        setTimeout(resolve, CHECK_ACTIVE_REQUESTS_INTERVAL),
      );
    }

    return new Promise<void>((resolve, reject) => {
      serverToClose.close((error) => {
        server = null;
        isShuttingDown = false;

        if (error) {
          reject(error);
        } else {
          resolve();
        }
      });
    });
  };

  return { start, shutdown };
};
