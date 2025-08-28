import { createSendNotificationUseCase } from "../../../application/useCases/createSendNotificationUseCase/createSendNotificationUseCase.js";
import { SendNotificationUseCase } from "../../../application/useCases/createSendNotificationUseCase/index.js";
import { getNotificationDeliveryServiceInstance } from "../services/getNotificationDeliveryServiceInstance.js";
import { getLoggerAdapterInstance } from "../services/getLoggerAdapterInstance.js";

let instance: SendNotificationUseCase | null = null;

export const getSendNotificationUseCaseInstance =
  (): SendNotificationUseCase => {
    if (instance === null) {
      const loggerAdapter = getLoggerAdapterInstance();
      const notificationDeliveryService =
        getNotificationDeliveryServiceInstance();

      instance = createSendNotificationUseCase(
        notificationDeliveryService,
        loggerAdapter,
      );
    }

    return instance;
  };
