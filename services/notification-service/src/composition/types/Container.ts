import type { ErrorRequestHandler, RequestHandler } from "express";
import type { OpenAPIV3_1 } from "openapi-types";

import type {
  Consumer,
  Logger,
  Meter,
  Producer,
  Tracer,
  Notification,
  Server,
} from "@notification-platform/shared";
import type { DeliveryService } from "../../application/services/createDeliveryService/index.js";
import type { Generator } from "../../application/types/index.js";
import type { CheckHealthUseCase } from "../../application/useCases/createCheckHealthUseCase/index.js";
import type { HandleIncomingNotificationsUseCase } from "../../application/useCases/createHandleIncomingNotificationsUseCase/index.js";
import type { Channel } from "../../domain/ports/index.js";
import type {
  HealthcheckController,
  NotificationController,
} from "../../infrastructure/http/index.js";

export type Container = {
  readonly deliveryService: DeliveryService;

  readonly handleIncomingNotificationsUseCase: HandleIncomingNotificationsUseCase;
  readonly checkHealthUseCase: CheckHealthUseCase;

  readonly bitrixChannel?: Channel;
  readonly emailChannel?: Channel;

  readonly requestLoggerMiddleware: RequestHandler;
  readonly authenticationMiddleware?: RequestHandler;
  readonly authorizationMiddleware?: RequestHandler;
  readonly notFoundMiddleware: RequestHandler;
  readonly timeoutErrorMiddleware: ErrorRequestHandler;
  readonly internalServerErrorMiddleware: ErrorRequestHandler;
  readonly healthcheckController: HealthcheckController;
  readonly notificationController: NotificationController;
  readonly swaggerSpecification: OpenAPIV3_1.Document;
  readonly server: Server;

  readonly generator: Generator;

  readonly producer: Producer<Notification>;
  readonly batchConsumer: Consumer;

  readonly tracer: Tracer;
  readonly logger: Logger;
  readonly meter: Meter;
};
