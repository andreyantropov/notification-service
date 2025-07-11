import { createApp } from "../containers/appContainer.js";
import { EventType } from "../application/services/notificationLoggerService/index.js";
import { LogLevel } from "../shared/enums/LogLevel.js";

export const bootstrap = async (): Promise<void> => {
  const { server, notificationLoggerService } = createApp();

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
