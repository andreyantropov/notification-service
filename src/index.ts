import { bootstrap } from "./bootstrap/bootstrap";

(async () => {
  try {
    await bootstrap();
    process.exit(0);
  } catch {
    process.exit(1);
  }
})();
