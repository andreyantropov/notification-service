import type { Logger } from "@notification-platform/shared";
import type { RetryService } from "../../../interfaces/RetryService.js";

export interface LoggedRetryServiceDependencies {
  readonly retryService: RetryService;
  readonly logger: Logger;
}
