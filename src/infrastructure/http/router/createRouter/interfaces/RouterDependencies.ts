import { type RequestHandler } from "express";
import { type OpenAPIV3_1 } from "openapi-types";

import {
  type HealthController,
  type NotificationController,
} from "../../../controllers/index.js";

export interface RouterDependencies {
  readonly middlewares: {
    readonly authenticationMiddleware: RequestHandler;
    readonly authorizationMiddleware: RequestHandler;
  };
  readonly controllers: {
    readonly notificationController: NotificationController;
    readonly healthController: HealthController;
    readonly swaggerSpecification: OpenAPIV3_1.Document;
  };
}
