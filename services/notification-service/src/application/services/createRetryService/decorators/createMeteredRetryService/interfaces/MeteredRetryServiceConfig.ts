import type { Meter } from "../../../../../ports/Meter.js";
import type { RetryService } from "../../../interfaces/RetryService.js";

export interface MeteredRetryServiceConfig {
  readonly retryService: RetryService;
  readonly meter: Meter;
}
