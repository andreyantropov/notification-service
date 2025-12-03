import path from "node:path";

import { globSync } from "glob";

export type RunMigrationsOptions = {
  migrationsDir: string;
  isCompiled: boolean;
};

export async function runMigrations(
  options: RunMigrationsOptions,
): Promise<void> {
  const { migrationsDir, isCompiled } = options;
  const ext = isCompiled ? ".js" : ".ts";

  const migrationFiles = globSync(`migrations/[0-9]*${ext}`, {
    cwd: migrationsDir,
  }).sort();

  console.log("Запуск миграций:", migrationFiles);

  for (const file of migrationFiles) {
    const fullPath = path.resolve(migrationsDir, file);
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
      throw err;
    }
  }

  console.log("\nВсе миграции применены!");
}
