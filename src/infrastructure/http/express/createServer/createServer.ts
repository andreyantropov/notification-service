import { ServerConfig } from "./interfaces/ServerConfig.js";
import { ServerDependencies } from "./interfaces/ServerDependencies.js";
import { DEFAULT_LOGGER } from "../../../../shared/constants/defaults.js";
import { EventType } from "../../../../shared/enums/EventType.js";
import { noop } from "../../../../shared/utils/noop/noop.js";
import { Server } from "../../../ports/Server.js";

const CHECK_ACTIVE_REQUESTS_TIMEOUT = 100;

export const createServer = (
  dependencies: ServerDependencies,
  config: ServerConfig,
): Server => {
  const {
    app,
    activeRequestsCounter,
    loggerAdapter = DEFAULT_LOGGER,
  } = dependencies;
  const {
    port,
    gracefulShutdownTimeout,
    onStartError = noop,
    onShutdownError = noop,
  } = config;

  let server: ReturnType<typeof app.listen> | null = null;
  let isStarting = false;
  let isStopping = false;

  const start = async (): Promise<void> => {
    if (isStarting) {
      await loggerAdapter.warning({
        message: `Сервер уже запускается`,
        eventType: EventType.Bootstrap,
      });
      return;
    }

    if (server) {
      await loggerAdapter.warning({
        message: `Сервер уже запущен`,
        eventType: EventType.Bootstrap,
      });
      return;
    }

    if (isStopping) {
      await loggerAdapter.warning({
        message: `Нельзя запустить сервер во время остановки`,
        eventType: EventType.Bootstrap,
      });
      return;
    }

    isStarting = true;

    try {
      server = app.listen(port, async () => {
        isStarting = false;
      });
      await loggerAdapter.debug({
        message: `Сервер успешно запущен`,
        eventType: EventType.Bootstrap,
      });
    } catch (error) {
      onStartError(
        new Error(`Не удалось запустить сервер на порту ${port}`, {
          cause: error,
        }),
      );
      await loggerAdapter.critical({
        message: `Не удалось запустить сервер на порту ${port}`,
        eventType: EventType.Bootstrap,
        error: error,
      });
    } finally {
      isStarting = false;
    }
  };

  const shutdown = async (): Promise<void> => {
    if (isStopping) {
      await loggerAdapter.warning({
        message: `Сервер уже останавливается`,
        eventType: EventType.Shutdown,
      });
      return;
    }

    if (isStarting) {
      await loggerAdapter.warning({
        message: `Нельзя остановить сервер во время запуска`,
        eventType: EventType.Shutdown,
      });
      return;
    }

    if (!server) {
      await loggerAdapter.warning({
        message: `Сервер уже остановлен`,
        eventType: EventType.Shutdown,
      });
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

      await loggerAdapter.debug({
        message: `Сервер успешно остановлен`,
        eventType: EventType.Shutdown,
      });
    } catch (error) {
      onShutdownError(
        new Error(`Не удалось корректно завершить работу сервера`, {
          cause: error,
        }),
      );
      await loggerAdapter.critical({
        message: `Не удалось корректно завершить работу сервера`,
        eventType: EventType.Shutdown,
        error: error,
      });
      throw error;
    } finally {
      isStopping = false;
    }
  };

  return { start, shutdown };
};
