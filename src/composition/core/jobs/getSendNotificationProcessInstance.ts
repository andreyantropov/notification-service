import { getNotificationDeliveryServiceInstance } from "../services/getNotificationDeliveryServiceInstance.js";
import { getLoggerAdapterInstance } from "../services/getLoggerAdapterInstance.js";
import { createSendNotificationProcess } from "../../../application/jobs/createSendNotificationProcess/index.js";
import { getBufferInstance } from "../../infrastracture/getBufferInstance.js";
import { processConfig } from "../../../configs/process.config.js";
import { SendNotificationProcess } from "../../../application/jobs/createSendNotificationProcess/interfaces/SendNotificationProcess.js";

let instance: SendNotificationProcess | null = null;

export const getSendNotificationProcessInstance =
  (): SendNotificationProcess => {
    if (instance === null) {
      const loggerAdapter = getLoggerAdapterInstance();
      const notificationDeliveryService =
        getNotificationDeliveryServiceInstance();
      const buffer = getBufferInstance();

      instance = createSendNotificationProcess(
        buffer,
        notificationDeliveryService,
        loggerAdapter,
        processConfig,
      );
    }

    return instance;
  };
