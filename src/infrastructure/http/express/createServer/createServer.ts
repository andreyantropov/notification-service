import { ServerConfig } from "./interfaces/ServerConfig.js";
import { ServerDependencies } from "./interfaces/ServerDependencies.js";
import { DEFAULT_LOGGER } from "../../../../shared/constants/defaults.js";
import { EventType } from "../../../../shared/enums/EventType.js";
import { LogLevel } from "../../../../shared/enums/LogLevel.js";
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
    onStopError = noop,
  } = config;

  let server: ReturnType<typeof app.listen> | null = null;
  let isStarting = false;
  let isStopping = false;

  const start = () => {
    if (isStarting) {
      loggerAdapter.writeLog({
        level: LogLevel.Warning,
        message: `Сервер уже запускается`,
        eventType: EventType.ServerWarning,
        spanId: `createServer`,
      });
      return;
    }

    if (server) {
      loggerAdapter.writeLog({
        level: LogLevel.Warning,
        message: `Сервер уже запущен`,
        eventType: EventType.ServerWarning,
        spanId: `createServer`,
      });
      return;
    }

    if (isStopping) {
      loggerAdapter.writeLog({
        level: LogLevel.Warning,
        message: `Нельзя запустить сервер во время остановки`,
        eventType: EventType.ServerWarning,
        spanId: `createServer`,
      });
      return;
    }

    isStarting = true;

    try {
      server = app.listen(port, async () => {
        isStarting = false;
      });
      loggerAdapter.writeLog({
        level: LogLevel.Debug,
        message: `Сервер успешно запущен`,
        eventType: EventType.ServerSuccess,
        spanId: `createServer`,
      });
    } catch (error) {
      onStartError(
        new Error(`Не удалось запустить сервер на порту ${port}`, {
          cause: error,
        }),
      );
      loggerAdapter.writeLog({
        level: LogLevel.Critical,
        message: `Не удалось запустить сервер на порту ${port}`,
        eventType: EventType.ServerError,
        spanId: `createServer`,
        error: error,
      });
    } finally {
      isStarting = false;
    }
  };

  const stop = async (): Promise<void> => {
    if (isStopping) {
      loggerAdapter.writeLog({
        level: LogLevel.Warning,
        message: `Сервер уже останавливается`,
        eventType: EventType.ServerWarning,
        spanId: `createServer`,
      });
      return;
    }

    if (isStarting) {
      loggerAdapter.writeLog({
        level: LogLevel.Warning,
        message: `Нельзя остановить сервер во время запуска`,
        eventType: EventType.ServerWarning,
        spanId: `createServer`,
      });
      return;
    }

    if (!server) {
      loggerAdapter.writeLog({
        level: LogLevel.Warning,
        message: `Сервер уже остановлен`,
        eventType: EventType.ServerWarning,
        spanId: `createServer`,
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

      loggerAdapter.writeLog({
        level: LogLevel.Debug,
        message: `Сервер успешно остановлен`,
        eventType: EventType.ServerSuccess,
        spanId: `createServer`,
      });
    } catch (error) {
      onStopError(
        new Error(`Не удалось корректно завершить работу сервера`, {
          cause: error,
        }),
      );
      loggerAdapter.writeLog({
        level: LogLevel.Critical,
        message: `Не удалось корректно завершить работу сервера`,
        eventType: EventType.ServerError,
        spanId: `createServer`,
        error: error,
      });
      throw error;
    } finally {
      isStopping = false;
    }
  };

  return { start, stop };
};
