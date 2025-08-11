import { EventType } from "../../application/services/createNotificationLoggerService/index.js";
import { serverConfig } from "../../configs/server.config.js";
import { LogLevel } from "../../shared/enums/LogLevel.js";
import { getNotificationLoggerServiceInstance } from "../core/services/getNotificationLoggerServiceInstance.js";
import { getActiveRequestCounterInstance } from "./middleware/getActiveRequestCounterInstance.js";
import { getAppInstance } from "./getAppInstance.js";
import {
  createServer,
  Server,
} from "../../infrastructure/http/express/createServer/index.js";

let instance: Server | null = null;

export const getServerInstance = () => {
  if (instance === null) {
    const { port, gracefulShutdownTimeout } = serverConfig;

    const notificationLoggerService = getNotificationLoggerServiceInstance();
    const activeRequestsCounter = getActiveRequestCounterInstance();
    const app = getAppInstance();

    const server = createServer(
      app,
      {
        port,
        gracefulShutdownTimeout,
        onStartError: (error) => {
          notificationLoggerService.writeLog({
            level: LogLevel.Error,
            message: `Не удалось запустить сервер`,
            eventType: EventType.ServerError,
            spanId: "getServerInstance",
            error,
          });
        },
        onStopError: (error) => {
          notificationLoggerService.writeLog({
            level: LogLevel.Error,
            message: `Не удалось корректно завершить работу сервера`,
            eventType: EventType.ServerError,
            spanId: "getServerInstance",
            error,
          });
        },
      },
      { activeRequestsCounter },
    );

    instance = server;
  }

  return instance;
};
