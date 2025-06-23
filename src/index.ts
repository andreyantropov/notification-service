import { bootstrap } from "./bootstrap/bootstrap.js";

try {
  await bootstrap();
  process.exit(0);
} catch {
  process.exit(1);
}
