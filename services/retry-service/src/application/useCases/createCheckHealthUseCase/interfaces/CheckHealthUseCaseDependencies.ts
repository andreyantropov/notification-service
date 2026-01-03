import type { Consumer } from "@notification-platform/shared";

export interface CheckHealthUseCaseDependencies {
  readonly retryConsumer: Consumer;
}
