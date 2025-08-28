import { getLoggerAdapterInstance, getServerInstance } from "../index.js";
import { LogLevel } from "../../shared/enums/LogLevel.js";
import { EventType } from "../../shared/enums/EventType.js";

export const bootstrap = async (): Promise<void> => {
  let loggerAdapter;

  try {
    loggerAdapter = getLoggerAdapterInstance();
    const server = getServerInstance();

    server.start();

    await loggerAdapter.writeLog({
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
    if (loggerAdapter) {
      await loggerAdapter.writeLog({
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
