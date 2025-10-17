import { ServerConfig } from "./interfaces/ServerConfig.js";
import { ServerDependencies } from "./interfaces/ServerDependencies.js";
import { noop } from "../../../../shared/utils/noop/noop.js";
import { Server } from "../../interfaces/Server.js";

const CHECK_ACTIVE_REQUESTS_TIMEOUT = 100;

export const createServer = (
  dependencies: ServerDependencies,
  config: ServerConfig,
): Server => {
  const { app, activeRequestsCounter } = dependencies;
  const {
    port,
    gracefulShutdownTimeout,
    onStart = noop,
    onStartWarning = noop,
    onStartError = noop,
    onRuntimeError = noop,
    onShutdown = noop,
    onShutdownWarning = noop,
    onShutdownError = noop,
  } = config;

  let server: ReturnType<typeof app.listen> | null = null;
  let isStarting = false;
  let isStopping = false;

  const start = (): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (isStarting) {
        const warning = `Сервер уже запускается`;
        onStartWarning(warning);
        resolve();
        return;
      }

      if (isStopping) {
        const warning = `Нельзя запустить сервер во время остановки`;
        onStartWarning(warning);
        resolve();
        return;
      }

      if (server) {
        const warning = `Сервер уже запущен`;
        onStartWarning(warning);
        resolve();
        return;
      }

      isStarting = true;

      server = app.listen(port, () => {
        isStarting = false;
        onStart();
        resolve();
      });

      server.on("error", (error) => {
        if (isStarting) {
          isStarting = false;
          const wrappedError = new Error(
            `Не удалось запустить сервер на порту ${port}`,
            {
              cause: error,
            },
          );

          onStartError(wrappedError);
          reject(wrappedError);
        } else {
          const wrappedError = new Error(
            `Критическая ошибка сервера во время работы`,
            { cause: error },
          );

          onRuntimeError(wrappedError);
        }
      });
    });
  };

  const shutdown = async (): Promise<void> => {
    if (isStarting) {
      onShutdownWarning(`Нельзя остановить сервер во время запуска`);
      return;
    }

    if (isStopping) {
      onShutdownWarning(`Сервер уже останавливается`);
      return;
    }

    if (!server) {
      onShutdownWarning(`Сервер уже остановлен`);
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
      onShutdown();
    } catch (error) {
      const wrappedError = new Error(
        `Не удалось корректно завершить работу сервера`,
        {
          cause: error,
        },
      );
      onShutdownError(wrappedError);
      throw wrappedError;
    } finally {
      isStopping = false;
    }
  };

  return { start, shutdown };
};
