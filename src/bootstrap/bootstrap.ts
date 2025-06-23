import { EventType } from "../application/services/notificationLoggerService/index.js";
import { createApp } from "../containers/appContainer.js";
import { LogLevel } from "../shared/enums/LogLevel.js";

export const bootstrap = async () => {
  const { notificationLogger, notificationProcessService } = createApp();

  try {
    await notificationProcessService.processNotifications();
  } catch (error) {
    try {
      await notificationLogger.writeLog({
        level: LogLevel.Critical,
        message: "Критическая ошибка в работе приложения",
        eventType: EventType.BootstrapError,
        spanId: "bootstrap",
        error: error,
      });
    } catch (logError) {
      console.error("Не удалось записать лог:", logError);
      console.error("Исходная ошибка:", error);
    }

    throw error;
  }
};
