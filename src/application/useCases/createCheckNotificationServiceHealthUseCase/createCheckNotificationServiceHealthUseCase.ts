import {
  CheckNotificationServiceHealthUseCase,
  CheckNotificationServiceHealthUseCaseDependencies,
} from "./interfaces/index.js";

export const createCheckNotificationServiceHealthUseCase = (
  dependencies: CheckNotificationServiceHealthUseCaseDependencies,
): CheckNotificationServiceHealthUseCase => {
  const {
    notificationDeliveryService,
    producer,
    batchConsumer,
    retryConsumer,
  } = dependencies;

  const checkHealth = async (): Promise<void> => {
    const promises: Promise<void>[] = [];

    if (notificationDeliveryService.checkHealth) {
      promises.push(notificationDeliveryService.checkHealth());
    }

    if (producer.checkHealth) {
      promises.push(producer.checkHealth());
    }

    if (batchConsumer.checkHealth) {
      promises.push(batchConsumer.checkHealth());
    }

    if (retryConsumer.checkHealth) {
      promises.push(retryConsumer.checkHealth());
    }

    await Promise.all(promises);
  };

  return {
    checkHealth,
  };
};
