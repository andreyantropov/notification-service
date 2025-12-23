import type { Logger } from "../../../../../ports/Logger.js";
import type { RetryService } from "../../../interfaces/RetryService.js";

export interface LoggedRetryServiceConfig {
  readonly retryService: RetryService;
  readonly logger: Logger;
}
