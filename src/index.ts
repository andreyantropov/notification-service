import { EventType } from "./application/services/notificationLoggerService";
import { createApp } from "./containers/appContainer";
import { LogLevel } from "./shared/enums/LogLevel";

const bootstrap = async () => {
  const { notificationLogger, notificationProcessService } = createApp();

  try {
    await notificationProcessService.processNotifications();
    process.exit(0);
  } catch (error) {
    await notificationLogger.writeLog({
      level: LogLevel.Critical,
      message: "Критическая ошибка в работе приложения",
      eventType: EventType.BootstrapError,
      spanId: "bootstrap",
      payload: null,
      error: error,
    });
    process.exit(1);
  }
};

(async () => {
  await bootstrap();
})();
