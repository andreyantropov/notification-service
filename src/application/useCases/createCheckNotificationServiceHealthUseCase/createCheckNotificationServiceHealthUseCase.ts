import { CheckNotificationServiceHealthUseCase } from "./interfaces/CheckNotificationServiceHealthUseCase.js";
import { CheckNotificationServiceHealthUseCaseDependencies } from "./interfaces/CheckNotificationServiceHealthUseCaseDependencies.js";

export const createCheckNotificationServiceHealthUseCase = (
  dependencies: CheckNotificationServiceHealthUseCaseDependencies,
): CheckNotificationServiceHealthUseCase => {
  const { notificationDeliveryService } = dependencies;

  const checkHealth = async (): Promise<void> => {
    if (!notificationDeliveryService.checkHealth) {
      return;
    }
    await notificationDeliveryService.checkHealth();
  };

  return {
    checkHealth,
  };
};
