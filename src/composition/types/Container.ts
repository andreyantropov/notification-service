import { Express } from "express";

import { SendNotificationProcess } from "../../application/jobs/createSendNotificationProcess/index.js";
import { Buffer } from "../../application/ports/Buffer.js";
import { LoggerAdapter } from "../../application/ports/LoggerAdapter.js";
import { TracingContextManager } from "../../application/ports/TracingContextManager.js";
import { NotificationDeliveryService } from "../../application/services/createNotificationDeliveryService/index.js";
import { SendNotificationUseCase } from "../../application/useCases/createSendNotificationUseCase/index.js";
import { Notification } from "../../domain/types/Notification.js";
import { Counter } from "../../infrastructure/ports/Counter.js";
import { Server } from "../../infrastructure/ports/Server.js";

export type Container = {
  app: Express;
  loggerAdapter: LoggerAdapter;
  tracingContextManager: TracingContextManager;
  activeRequestsCounter: Counter;
  buffer: Buffer<Notification>;
  server: Server;

  notificationDeliveryService: NotificationDeliveryService;
  sendNotificationUseCase: SendNotificationUseCase;
  sendNotificationProcess: SendNotificationProcess;
};
