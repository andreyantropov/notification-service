import type { Meter } from "../../../../../ports/index.js";
import type { RetryService } from "../../../interfaces/RetryService.js";

export interface MeteredRetryServiceDependencies {
  readonly retryService: RetryService;
  readonly meter: Meter;
}
