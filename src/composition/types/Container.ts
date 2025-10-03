import { NodeSDK } from "@opentelemetry/sdk-node";
import { Express } from "express";

import { SendNotificationProcess } from "../../application/jobs/createSendNotificationProcess/index.js";
import { Buffer } from "../../application/ports/Buffer.js";
import { NotificationDeliveryService } from "../../application/services/createNotificationDeliveryService/index.js";
import { SendNotificationUseCase } from "../../application/useCases/createSendNotificationUseCase/index.js";
import { Notification } from "../../domain/types/Notification.js";
import { Counter } from "../../infrastructure/ports/Counter.js";
import { LoggerAdapter } from "../../infrastructure/ports/LoggerAdapter.js";
import { Server } from "../../infrastructure/ports/Server.js";
import { TracingContextManager } from "../../infrastructure/ports/TracingContextManager.js";

export type Container = {
  telemetrySDK: NodeSDK;
  tracingContextManager: TracingContextManager;
  loggerAdapter: LoggerAdapter;
  app: Express;
  activeRequestsCounter: Counter;
  buffer: Buffer<Notification>;
  server: Server;

  notificationDeliveryService: NotificationDeliveryService;
  sendNotificationUseCase: SendNotificationUseCase;
  sendNotificationProcess: SendNotificationProcess;
};
