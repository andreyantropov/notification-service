import { EventType } from "../../application/services/notificationLoggerService/index.js";
import { serverConfig } from "../../configs/server.config.js";
import { LogLevel } from "../../shared/enums/LogLevel.js";
import { createDefaultNotificationLoggerService } from "../index.js";
import { getDefaultActiveRequestCounter } from "./activeRequestsCounter.js";
import { createDefaultApp } from "./app.js";

const CHECK_ACTIVE_REQUESTS_TIMEOUT = 100;

export const createDefaultServer = () => {
  const { port, gracefulShutdownTimeout } = serverConfig;

  const notificationLoggerService = createDefaultNotificationLoggerService();
  const activeRequestsCounter = getDefaultActiveRequestCounter();
  const app = createDefaultApp();

  let server: ReturnType<typeof app.listen> | null = null;

  const start = () => {
    server = app.listen(port, async () => {
      await notificationLoggerService.writeLog({
        level: LogLevel.Info,
        message: `HTTP-сервер успешно запущен на порту ${port}`,
        eventType: EventType.ServerSuccess,
        spanId: "createDefaultServer",
      });

      console.log(`Server running on port ${port}`);
      console.log(
        `Swagger docs available at http://localhost:${port}/api-docs`,
      );
    });
  };

  const stop = async (): Promise<void> => {
    if (!server) {
      return;
    }

    const serverClosePromise = new Promise<void>((resolve, reject) => {
      server?.close(async (error) => {
        if (error) {
          await notificationLoggerService.writeLog({
            level: LogLevel.Error,
            message: `Не удалось закрыть сервер для новых подключений`,
            eventType: EventType.ServerError,
            spanId: "createDefaultServer",
            error: error,
          });
          reject(error);
        } else {
          await notificationLoggerService.writeLog({
            level: LogLevel.Info,
            message: `Сервер закрыт для новых подключений`,
            eventType: EventType.ServerSuccess,
            spanId: "createDefaultServer",
          });
          resolve();
        }
      });
    });

    const timeoutPromise = new Promise<void>((_, reject) => {
      setTimeout(async () => {
        await notificationLoggerService.writeLog({
          level: LogLevel.Error,
          message: `Истекло время ожидания обработки запросов`,
          eventType: EventType.ServerError,
          spanId: "createDefaultServer",
        });
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

      await notificationLoggerService.writeLog({
        level: LogLevel.Info,
        message: `Сервер успешно остановлен`,
        eventType: EventType.ServerSuccess,
        spanId: "createDefaultServer",
      });

      console.log(`Server gracefully retired`);
    } catch (error) {
      await notificationLoggerService.writeLog({
        level: LogLevel.Error,
        message: `Не удалось корректно завершить работу сервера`,
        eventType: EventType.ServerError,
        spanId: "createDefaultServer",
        error: error,
      });
      throw error;
    }
  };

  return { start, stop };
};
