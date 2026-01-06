import type { ErrorRequestHandler, RequestHandler } from "express";

import type {
  Consumer,
  Logger,
  Meter,
} from "@notification-platform/shared";
import type { RetryService } from "../../application/services/createRetryService/index.js";
import type { CheckHealthUseCase } from "../../application/useCases/createCheckHealthUseCase/index.js";
import type {
  Server,
} from "@notification-planform/http";
import type { HealthcheckController } from "../../infrastracture/http/index.js";

export type Container = {
  readonly retryService: RetryService;

  readonly checkHealthUseCase: CheckHealthUseCase;

  readonly requestLoggerMiddleware: RequestHandler;
  readonly notFoundMiddleware: RequestHandler;
  readonly timeoutErrorMiddleware: ErrorRequestHandler;
  readonly internalServerErrorMiddleware: ErrorRequestHandler;
  readonly healthcheckController: HealthcheckController;
  readonly server: Server;

  readonly generator: Generator;

  readonly retryConsumer: Consumer;

  readonly logger: Logger;
  readonly meter: Meter;
};
