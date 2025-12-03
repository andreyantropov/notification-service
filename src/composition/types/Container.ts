import { ErrorRequestHandler, RequestHandler } from "express";
import { OpenAPIV3_1 } from "openapi-types";

import {
  Consumer,
  Logger,
  Meter,
  Producer,
  Tracer,
} from "../../application/ports/index.js";
import { NotificationDeliveryService } from "../../application/services/createNotificationDeliveryService/index.js";
import { NotificationRetryService } from "../../application/services/createNotificationRetryService/index.js";
import { Generator } from "../../application/types/index.js";
import { CheckNotificationServiceHealthUseCase } from "../../application/useCases/createCheckNotificationServiceHealthUseCase/index.js";
import { HandleIncomingNotificationsUseCase } from "../../application/useCases/createHandleIncomingNotificationsUseCase/index.js";
import { Channel } from "../../domain/ports/index.js";
import { Notification } from "../../domain/types/index.js";
import {
  Server,
  HealthcheckController,
  NotificationController,
} from "../../infrastructure/http/index.js";

export type Container = {
  readonly notificationDeliveryService: NotificationDeliveryService;
  readonly notificationRetryService: NotificationRetryService;

  readonly handleIncomingNotificationsUseCase: HandleIncomingNotificationsUseCase;
  readonly checkNotificationServiceHealthUseCase: CheckNotificationServiceHealthUseCase;

  readonly bitrixChannel: Channel;
  readonly emailChannel: Channel;

  readonly rateLimiterMiddleware: RequestHandler;
  readonly requestLoggerMiddleware: RequestHandler;
  readonly authenticationMiddleware: RequestHandler;
  readonly authorizationMiddleware: RequestHandler;
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
  readonly retryConsumer: Consumer;

  readonly tracer: Tracer;
  readonly logger: Logger;
  readonly meter: Meter;
};
