import type { Logger } from "../../../../../ports/index.js";
import type { RetryService } from "../../../interfaces/RetryService.js";

export interface LoggedRetryServiceDependencies {
  readonly retryService: RetryService;
  readonly logger: Logger;
}
