import { asFunction, AwilixContainer } from "awilix";

import { createSendNotificationProcess } from "../../../application/jobs/createSendNotificationProcess/createSendNotificationProcess.js";
import { processConfig } from "../../../configs/process.config.js";
import { Container } from "../../types/Container.js";

export const registerJobs = (container: AwilixContainer<Container>) => {
  container.register({
    sendNotificationProcess: asFunction(
      ({ buffer, notificationDeliveryService }) =>
        createSendNotificationProcess(
          {
            buffer,
            notificationDeliveryService,
          },
          processConfig,
        ),
    ).singleton(),
  });
};
