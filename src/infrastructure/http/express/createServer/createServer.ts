import { Express } from "express";
import { ServerConfig } from "./interfaces/ServerConfig.js";
import { Server } from "../../../ports/Server.js";
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
  let isStarting = false;
  let isStopping = false;

  const start = () => {
    if (isStarting) {
      onStartError(new Error("Сервер уже запускается"));
      return;
    }

    if (server) {
      onStartError(new Error("Сервер уже запущен"));
      return;
    }

    if (isStopping) {
      onStartError(new Error("Нельзя запустить сервер во время остановки"));
      return;
    }

    isStarting = true;

    try {
      server = app.listen(port, async () => {
        isStarting = false;
      });
    } catch (error) {
      onStartError(
        new Error(`Не удалось запустить сервер на порту ${port}`, {
          cause: error,
        }),
      );
    } finally {
      isStarting = false;
    }
  };

  const stop = async (): Promise<void> => {
    if (isStopping) {
      onStopError(new Error("Сервер уже останавливается"));
      return;
    }

    if (isStarting) {
      onStopError(new Error("Нельзя остановить сервер во время запуска"));
      return;
    }

    if (!server) {
      return;
    }

    isStopping = true;

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

      server = null;
      isStopping = false;
    } catch (error) {
      onStopError(
        new Error(`Не удалось корректно завершить работу сервера`, {
          cause: error,
        }),
      );
      throw error;
    } finally {
      isStopping = false;
    }
  };

  return { start, stop };
};
