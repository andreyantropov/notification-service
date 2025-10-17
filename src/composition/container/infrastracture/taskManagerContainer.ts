import { AwilixContainer, asFunction } from "awilix";

import { taskManagerConfig } from "../../../configs/index.js";
import { createScheduler } from "../../../infrastructure/schedulers/createScheduler/createScheduler.js";
import { EventType } from "../../../infrastructure/telemetry/logging/index.js";
import { Container } from "../../types/Container.js";

export const registerTaskManager = (container: AwilixContainer<Container>) => {
  container.register({
    taskManager: asFunction(
      ({ processBufferedNotificationsUseCase, logger }) => {
        return createScheduler(
          { task: processBufferedNotificationsUseCase.process },
          {
            ...taskManagerConfig,
            onError: (error) =>
              logger.error({
                message: `Не удалось отправить отложенное уведомление`,
                eventType: EventType.MessagePublish,
                error,
              }),
          },
        );
      },
    ).singleton(),
  });
};
