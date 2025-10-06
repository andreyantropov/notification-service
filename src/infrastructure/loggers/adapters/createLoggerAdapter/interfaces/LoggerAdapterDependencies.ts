import { Logger } from "../../../../ports/Logger.js";
import { TracingContextManager } from "../../../../ports/TracingContextManager.js";

export interface LoggerAdapterDependencies {
  logger: Logger;
  tracingContextManager: TracingContextManager;
}
