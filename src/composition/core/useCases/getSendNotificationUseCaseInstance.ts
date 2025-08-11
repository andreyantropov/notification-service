import { createSendNotificationUseCase } from "../../../application/useCases/createSendNotificationUseCase/createSendNotificationUseCase.js";
import { SendNotificationUseCase } from "../../../application/useCases/createSendNotificationUseCase/index.js";
import { getNotificationDeliveryServiceInstance } from "../services/getNotificationDeliveryServiceInstance.js";
import { getNotificationLoggerServiceInstance } from "../services/getNotificationLoggerServiceInstance.js";

let instance: SendNotificationUseCase | null = null;

export const getSendNotificationUseCaseInstance =
  (): SendNotificationUseCase => {
    if (instance === null) {
      const notificationLoggerService = getNotificationLoggerServiceInstance();
      const notificationDeliveryService =
        getNotificationDeliveryServiceInstance();

      instance = createSendNotificationUseCase(
        notificationDeliveryService,
        notificationLoggerService,
      );
    }

    return instance;
  };
