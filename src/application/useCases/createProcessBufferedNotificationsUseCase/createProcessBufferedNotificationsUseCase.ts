import { ProcessBufferedNotificationsUseCase } from "./interfaces/ProcessBufferedNotificationsUseCase.js";
import { ProcessBufferedNotificationsUseCaseDependencies } from "./interfaces/ProcessBufferedNotificationsUseCaseDependencies.js";

export const createProcessBufferedNotificationsUseCase = (
  dependencies: ProcessBufferedNotificationsUseCaseDependencies,
): ProcessBufferedNotificationsUseCase => {
  const { buffer, notificationDeliveryService } = dependencies;

  const process = async (): Promise<void> => {
    const notifications = await buffer.takeAll();
    if (notifications.length === 0) return;

    await notificationDeliveryService.send(notifications);
  };

  return { process };
};
