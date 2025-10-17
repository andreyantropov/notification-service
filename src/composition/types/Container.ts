import { NodeSDK } from "@opentelemetry/sdk-node";
import { Express } from "express";

import { Buffer } from "../../application/ports/Buffer.js";
import { NotificationDeliveryService } from "../../application/services/createNotificationDeliveryService/index.js";
import { CheckNotificationServiceHealthUseCase } from "../../application/useCases/createCheckNotificationServiceHealthUseCase/index.js";
import { HandleIncomingNotificationsUseCase } from "../../application/useCases/createHandleIncomingNotificationsUseCase/index.js";
import { ProcessBufferedNotificationsUseCase } from "../../application/useCases/createProcessBufferedNotificationsUseCase/index.js";
import { Notification } from "../../domain/types/Notification.js";
import { Server } from "../../infrastructure/http/interfaces/Server.js";
import { Counter } from "../../infrastructure/ports/Counter.js";
import { Logger } from "../../infrastructure/ports/Logger.js";
import { TracingContextManager } from "../../infrastructure/ports/TracingContextManager.js";
import { Scheduler } from "../../infrastructure/schedulers/createScheduler/interfaces/Scheduler.js";

export type Container = {
  telemetrySDK: NodeSDK;
  tracingContextManager: TracingContextManager;
  logger: Logger;
  taskManager: Scheduler;
  app: Express;
  activeRequestsCounter: Counter;
  buffer: Buffer<Notification>;
  server: Server;

  notificationDeliveryService: NotificationDeliveryService;
  handleIncomingNotificationsUseCase: HandleIncomingNotificationsUseCase;
  checkNotificationServiceHealthUseCase: CheckNotificationServiceHealthUseCase;
  processBufferedNotificationsUseCase: ProcessBufferedNotificationsUseCase;
};
