import { SendNotificationProcess } from "../../application/jobs/createSendNotificationProcess/index.js";
import { LoggerAdapter } from "../../application/ports/LoggerAdapter.js";
import { Server } from "../../infrastructure/ports/Server.js";
import { EventType } from "../../shared/enums/EventType.js";
import { container } from "../container/container.js";
import { telemetrySdk } from "../tracing/tracing.js";

const startApplication = async (loggerAdapter: LoggerAdapter) => {
  const sendNotificationProcess = container.resolve<SendNotificationProcess>(
    "sendNotificationProcess",
  );
  const server = container.resolve<Server>("server");

  sendNotificationProcess.start();
  await server.start();

  await loggerAdapter.debug({
    message: "Приложение успешно запущено",
    eventType: EventType.Bootstrap,
  });

  return { sendNotificationProcess, server };
};

const setupGracefulShutdown = (
  loggerAdapter: LoggerAdapter,
  sendNotificationProcess: SendNotificationProcess,
  server: Server,
) => {
  const shutdown = async () => {
    try {
      sendNotificationProcess.stop();
      await server.stop();

      await loggerAdapter.debug({
        message: "Приложение корректно завершило работу",
        eventType: EventType.Shutdown,
      });

      await telemetrySdk.shutdown();
    } catch (error) {
      await loggerAdapter.error({
        message: "Ошибка при завершении работы",
        eventType: EventType.Shutdown,
        error,
      });
    } finally {
      process.exit(0);
    }
  };

  const SHUTDOWN_SIGNALS = ["SIGTERM", "SIGINT", "SIGQUIT"] as const;
  SHUTDOWN_SIGNALS.forEach((signal) => {
    process.on(signal, () => {
      SHUTDOWN_SIGNALS.forEach((s) => process.removeAllListeners(s));
      void shutdown();
    });
  });
};

export const bootstrap = async (): Promise<void> => {
  let loggerAdapter: LoggerAdapter | undefined;

  try {
    loggerAdapter = container.resolve<LoggerAdapter>("loggerAdapter");

    const { sendNotificationProcess, server } =
      await startApplication(loggerAdapter);
    setupGracefulShutdown(loggerAdapter, sendNotificationProcess, server);
  } catch (error) {
    if (loggerAdapter) {
      await loggerAdapter.critical({
        message: "Критическая ошибка при запуске приложения",
        eventType: EventType.Bootstrap,
        error,
      });
    } else {
      console.error("Критическая ошибка при запуске приложения", error);
    }
    process.exit(1);
  }
};
