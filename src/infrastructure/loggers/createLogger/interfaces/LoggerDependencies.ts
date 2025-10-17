import { TracingContextManager } from "../../../ports/TracingContextManager.js";
import { Logger as InfrastractureLogger } from "../../../telemetry/logging/interfaces/Logger.js";

export interface LoggerDependencies {
  logger: InfrastractureLogger;
  tracingContextManager: TracingContextManager;
}
