export const bootstrap = async () => {
  try {
    const { start } = await import("../lifecycle/start.js");
    await start();

    const shutdownHandler = async () => {
      process.removeAllListeners("SIGTERM");
      process.removeAllListeners("SIGINT");
      process.removeAllListeners("SIGQUIT");

      const { shutdown } = await import("../lifecycle/shutdown.js");
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
