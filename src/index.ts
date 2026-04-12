import { createApp } from "./compositionRoot/createApp/index.js";

try {
  const app = createApp();

  await app.start();

  process.on("SIGTERM", async () => await app.shutdown());
  process.on("SIGINT", async () => await app.shutdown());
} catch (error) {
  console.error("Критическая ошибка в работе сервиса", error);
  process.exit(1);
}
