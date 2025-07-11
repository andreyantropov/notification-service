import { bootstrap } from "./bootstrap/bootstrap.js";

try {
  await bootstrap();
} catch (error) {
  console.error(`Критическая ошибка в работе приложения: ${error}`);
  process.exit(1);
}
