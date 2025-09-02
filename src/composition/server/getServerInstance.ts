import { serverConfig } from "../../configs/server.config.js";
import { LogLevel } from "../../shared/enums/LogLevel.js";
import { getLoggerAdapterInstance } from "../core/services/getLoggerAdapterInstance.js";
import { getAppInstance } from "./getAppInstance.js";
import { createServer } from "../../infrastructure/http/express/createServer/index.js";
import { EventType } from "../../shared/enums/EventType.js";
import { getActiveRequestCounterInstance } from "../infrastracture/getActiveRequestCounterInstance.js";
import { Server } from "../../infrastructure/ports/Server.js";

let instance: Server | null = null;

export const getServerInstance = () => {
  if (instance === null) {
    const { port, gracefulShutdownTimeout } = serverConfig;

    const loggerAdapter = getLoggerAdapterInstance();
    const activeRequestsCounter = getActiveRequestCounterInstance();
    const app = getAppInstance();

    const server = createServer(
      app,
      {
        port,
        gracefulShutdownTimeout,
        onStartError: (error) => {
          loggerAdapter.writeLog({
            level: LogLevel.Error,
            message: `Не удалось запустить сервер`,
            eventType: EventType.ServerError,
            spanId: "getServerInstance",
            error,
          });
        },
        onStopError: (error) => {
          loggerAdapter.writeLog({
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
