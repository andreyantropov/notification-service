import {
  type Initiator,
  type Notification,
} from "../../../domain/types/index.js";
import { type IncomingNotification } from "../../types/index.js";

import {
  type ReceiveNotificationUseCase,
  type ReceiveNotificationUseCaseDependencies,
} from "./interfaces/index.js";

export const createReceiveNotificationUseCase = (
  dependencies: ReceiveNotificationUseCaseDependencies,
): ReceiveNotificationUseCase => {
  const { enrichmentService, deliveryService } = dependencies;

  const execute = async (
    incomingNotification: IncomingNotification,
    initiator: Initiator,
  ): Promise<Notification> => {
    const notification = enrichmentService.enrich(
      incomingNotification,
      initiator,
    );

    await deliveryService.deliver(notification);

    return notification;
  };

  return {
    execute,
  };
};
