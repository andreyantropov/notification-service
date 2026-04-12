import pkg from "../package.json" with { type: "json" };

import { env } from "./compositionRoot/env.js";
import { createSDK } from "./infrastructure/telemetry/index.js";

try {
  const sdk = createSDK({
    name: env.SERVICE_NAME,
    version: pkg.version,
    environment: env.NODE_ENV,
    port: env.SERVICE_PORT,
    exporters: {
      tracesExporterUrl: env.TELEMETRY_TRACES_EXPORTER_URL,
      logsExporterUrl: env.TELEMETRY_LOGS_EXPORTER_URL,
      metricsExporterUrl: env.TELEMETRY_METRICS_EXPORTER_URL,
    },
  });

  await sdk.start();

  process.on("SIGTERM", async () => await sdk.shutdown());
  process.on("SIGINT", async () => await sdk.shutdown());
} catch (error) {
  console.error("Не удалось запустить сбор телеметрии", error);
  process.exit(1);
}
