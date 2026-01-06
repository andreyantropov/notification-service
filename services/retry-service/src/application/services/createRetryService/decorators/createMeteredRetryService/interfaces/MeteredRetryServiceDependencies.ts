import type { Meter } from "@notification-platform/shared";
import type { RetryService } from "../../../interfaces/RetryService.js";

export interface MeteredRetryServiceDependencies {
  readonly retryService: RetryService;
  readonly meter: Meter;
}
