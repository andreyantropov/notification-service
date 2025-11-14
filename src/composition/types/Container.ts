import { Express } from "express";

import { Consumer } from "../../application/ports/Consumer.js";
import { Logger } from "../../application/ports/Logger.js";
import { Producer } from "../../application/ports/Producer.js";
import { NotificationDeliveryService } from "../../application/services/createNotificationDeliveryService/index.js";
import { CheckNotificationServiceHealthUseCase } from "../../application/useCases/createCheckNotificationServiceHealthUseCase/index.js";
import { HandleIncomingNotificationsUseCase } from "../../application/useCases/createHandleIncomingNotificationsUseCase/index.js";
import { Notification } from "../../domain/types/Notification.js";
import { Server } from "../../infrastructure/http/interfaces/Server.js";
import { Counter } from "../../infrastructure/ports/Counter.js";
import { Tracer } from "../../infrastructure/ports/Tracer.js";

export type Container = {
  tracer: Tracer;
  logger: Logger;
  app: Express;
  activeRequestsCounter: Counter;
  producer: Producer<Notification>;
  batchConsumer: Consumer;
  retryConsumer: Consumer;
  server: Server;

  notificationDeliveryService: NotificationDeliveryService;
  handleIncomingNotificationsUseCase: HandleIncomingNotificationsUseCase;
  checkNotificationServiceHealthUseCase: CheckNotificationServiceHealthUseCase;
};
