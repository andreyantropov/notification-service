import path from "node:path";
import { fileURLToPath } from "node:url";

import { globSync } from "glob";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isCompiled = __filename.endsWith(".js");
const ext = isCompiled ? ".js" : ".ts";

async function runMigrations() {
  const migrationFiles = globSync(`migrations/[0-9]*${ext}`, {
    cwd: path.resolve(__dirname, ".."),
  }).sort();

  console.log("Запуск миграций:", migrationFiles);

  for (const file of migrationFiles) {
    const fullPath = path.resolve(__dirname, "..", file);
    console.log(`\n▶️  Выполнение: ${file}`);
    try {
      const migration = await import(`file://${fullPath}`);
      if (typeof migration.default === "function") {
        await migration.default();
      } else {
        throw new Error(`Миграция ${file} не экспортирует default function`);
      }
      console.log(`Успешно: ${file}`);
    } catch (err) {
      console.error(`Провалено: ${file}`, err);
      process.exit(1);
    }
  }

  console.log("\nВсе миграции применены!");
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runMigrations().catch(() => process.exit(1));
}
