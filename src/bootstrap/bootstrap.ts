import { EventType } from "../application/services/notificationLoggerService/index.js";
import { createDefaultNotificationLoggerService } from "../composition/index.js";
import { createDefaultServer } from "../composition/server/server.js";
import { LogLevel } from "../shared/enums/LogLevel.js";

export const bootstrap = async (): Promise<void> => {
  const notificationLoggerService = createDefaultNotificationLoggerService();
  const server = createDefaultServer();

  try {
    server.start();
  } catch (error) {
    await notificationLoggerService.writeLog({
      level: LogLevel.Critical,
      message: "Критическая ошибка в работе приложения",
      eventType: EventType.BootstrapError,
      spanId: "bootstrap",
      error: error,
    });

    throw error;
  }
};
