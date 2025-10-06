import { shutdown } from "../lifecycle/shutdown.js";
import { start } from "../lifecycle/start.js";

export const bootstrap = async () => {
  try {
    await start();

    const shutdownHandler = async () => {
      process.removeAllListeners("SIGTERM");
      process.removeAllListeners("SIGINT");
      process.removeAllListeners("SIGQUIT");

      await shutdown();
      process.exit(0);
    };

    process.on("SIGTERM", shutdownHandler);
    process.on("SIGINT", shutdownHandler);
    process.on("SIGQUIT", shutdownHandler);
  } catch (error) {
    console.error("Критическая ошибка при запуске", error);
    process.exit(1);
  }
};
