import {
  type ErrorRequestHandler,
  type RequestHandler,
  type Router,
} from "express";

import {
  type HealthReporter,
  type IdGenerator,
} from "../../../application/ports/index.js";
import {
  type DeliveryService,
  type EnrichmentService,
  type HealthService,
} from "../../../application/services/index.js";
import {
  type CheckLivenessUseCase,
  type CheckReadinessUseCase,
  type ReceiveNotificationBatchUseCase,
  type ReceiveNotificationUseCase,
} from "../../../application/useCases/index.js";
import { type Channel } from "../../../domain/ports/index.js";
import { type Server } from "../../../infrastructure/http/index.js";
import {
  type Logger,
  type Meter,
  type Tracer,
} from "../../../infrastructure/telemetry/index.js";
import { type Env } from "../../env.js";

export interface Container {
  readonly env: Env;

  readonly tracer: Tracer;
  readonly logger: Logger;
  readonly meter: Meter;

  readonly bitrixChannel: Channel;
  readonly emailChannel: Channel;

  readonly idGenerator: IdGenerator;
  readonly healthReporter: HealthReporter;

  readonly enrichmentService: EnrichmentService;
  readonly deliveryService: DeliveryService;
  readonly healthService: HealthService;

  readonly receiveNotificationUseCase: ReceiveNotificationUseCase;
  readonly receiveNotificationBatchUseCase: ReceiveNotificationBatchUseCase;
  readonly checkLivenessUseCase: CheckLivenessUseCase;
  readonly checkReadinessUseCase: CheckReadinessUseCase;

  readonly preHandlers: (ErrorRequestHandler | RequestHandler)[];
  readonly postHandlers: (ErrorRequestHandler | RequestHandler)[];
  readonly router: Router;

  readonly server: Server;
}
