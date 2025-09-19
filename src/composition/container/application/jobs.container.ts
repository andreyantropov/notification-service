import { asFunction, AwilixContainer } from "awilix";

import { createSendNotificationProcess } from "../../../application/jobs/createSendNotificationProcess/createSendNotificationProcess.js";
import { processConfig } from "../../../configs/process.config.js";
import { Container } from "../../types/Container.js";

export const registerJobs = (container: AwilixContainer<Container>) => {
  container.register({
    sendNotificationProcess: asFunction(
      ({ buffer, notificationDeliveryService, loggerAdapter }) =>
        createSendNotificationProcess(
          { buffer, notificationDeliveryService, loggerAdapter },
          processConfig,
        ),
    ).singleton(),
  });
};
