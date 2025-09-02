import { createSendNotificationUseCase } from "../../../application/useCases/createSendNotificationUseCase/createSendNotificationUseCase.js";
import { getNotificationDeliveryServiceInstance } from "../services/getNotificationDeliveryServiceInstance.js";
import { getLoggerAdapterInstance } from "../services/getLoggerAdapterInstance.js";
import { getBufferInstance } from "../../infrastracture/getBufferInstance.js";
import { SendNotificationUseCase } from "../../../application/useCases/createSendNotificationUseCase/index.js";

let instance: SendNotificationUseCase | null = null;

export const getSendNotificationUseCaseInstance =
  (): SendNotificationUseCase => {
    if (instance === null) {
      const loggerAdapter = getLoggerAdapterInstance();
      const buffer = getBufferInstance();
      const notificationDeliveryService =
        getNotificationDeliveryServiceInstance();

      instance = createSendNotificationUseCase(
        buffer,
        notificationDeliveryService,
        loggerAdapter,
      );
    }

    return instance;
  };
