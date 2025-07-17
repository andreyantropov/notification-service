import {
  createSendNotificationUseCase,
  SendNotificationUseCase,
} from "../../application/useCases/sendNotificationUseCase/index.js";
import { createDefaultNotificationDeliveryService } from "./notificationDeliveryService.js";
import { createDefaultNotificationLoggerService } from "./notificationLoggerService.js";

export const createDefaultSendNotificationUseCase =
  (): SendNotificationUseCase => {
    const notificationLoggerService = createDefaultNotificationLoggerService();
    const notificationDeliveryService =
      createDefaultNotificationDeliveryService();

    const sendNotificationUseCase = createSendNotificationUseCase({
      notificationDeliveryService,
      notificationLoggerService,
    });

    return sendNotificationUseCase;
  };
