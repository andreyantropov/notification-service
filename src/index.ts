import { bootstrap } from "./application/bootstrap";

(async () => {
  try {
    await bootstrap();
    process.exit(0);
  } catch {
    process.exit(1);
  }
})();
