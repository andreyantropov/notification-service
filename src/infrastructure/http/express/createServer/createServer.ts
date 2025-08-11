import { Express } from "express";
import { ServerConfig } from "./interfaces/ServerConfig.js";
import { Server } from "./interfaces/Server.js";
import { ServerDependencies } from "./interfaces/ServerDependencies.js";

const CHECK_ACTIVE_REQUESTS_TIMEOUT = 100;

export const createServer = (
  app: Express,
  {
    port,
    gracefulShutdownTimeout,
    onStartError = () => {},
    onStopError = () => {},
  }: ServerConfig,
  { activeRequestsCounter }: ServerDependencies,
): Server => {
  let server: ReturnType<typeof app.listen> | null = null;

  const start = () => {
    try {
      server = app.listen(port, async () => {});
    } catch (error) {
      onStartError(
        new Error(`Не удалось запустить сервер на порту ${port}`, {
          cause: error,
        }),
      );
    }
  };

  const stop = async (): Promise<void> => {
    if (!server) {
      return;
    }

    const serverClosePromise = new Promise<void>((resolve, reject) => {
      server?.close(async (error) => {
        if (error) {
          reject(error);
        } else {
          resolve();
        }
      });
    });

    const timeoutPromise = new Promise<void>((_, reject) => {
      setTimeout(async () => {
        reject(
          new Error(`Shutdown timeout after ${gracefulShutdownTimeout}ms`),
        );
      }, gracefulShutdownTimeout);
    });

    const waitForRequestsPromise = (async () => {
      while (activeRequestsCounter.value > 0) {
        await new Promise((resolve) =>
          setTimeout(resolve, CHECK_ACTIVE_REQUESTS_TIMEOUT),
        );
      }
    })();

    try {
      await Promise.race([
        Promise.all([serverClosePromise, waitForRequestsPromise]),
        timeoutPromise,
      ]);
    } catch (error) {
      onStopError(
        new Error(`Не удалось корректно завершить работу сервера`, {
          cause: error,
        }),
      );
      throw error;
    }
  };

  return { start, stop };
};
