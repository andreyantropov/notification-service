import path from "node:path";
import { fileURLToPath } from "node:url";

import { runMigrations } from "./runner.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isCompiled = __filename.endsWith(".js");
const migrationsDir = path.resolve(__dirname, "..");

if (import.meta.url === `file://${process.argv[1]}`) {
  runMigrations({ migrationsDir, isCompiled }).catch(() => {
    process.exit(1);
  });
}
