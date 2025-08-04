import { EventType } from "../application/services/notificationLoggerService/index.js";
import { createDefaultNotificationLoggerService } from "../composition/index.js";
import { createDefaultServer } from "../composition/server/server.js";
import { LogLevel } from "../shared/enums/LogLevel.js";

export const bootstrap = async (): Promise<void> => {
  let notificationLoggerService;

  try {
    notificationLoggerService = createDefaultNotificationLoggerService();
    const server = createDefaultServer();

    server.start();

    await notificationLoggerService.writeLog({
      level: LogLevel.Info,
      message: "Приложение успешно запущено",
      eventType: EventType.BootstrapSuccess,
      spanId: "bootstrap",
    });

    const shutdown = async () => {
      await server.stop();
      process.exit(0);
    };

    const SHUTDOWN_SIGNALS = ["SIGTERM", "SIGINT", "SIGQUIT"] as const;
    SHUTDOWN_SIGNALS.forEach((signal) => process.on(signal, shutdown));
  } catch (error) {
    if (notificationLoggerService) {
      await notificationLoggerService.writeLog({
        level: LogLevel.Critical,
        message: "Критическая ошибка в работе приложения",
        eventType: EventType.BootstrapError,
        spanId: "bootstrap",
        error: error,
      });
    } else {
      console.error("Критическая ошибка в работе приложения", error);
    }

    process.exit(1);
  }
};
