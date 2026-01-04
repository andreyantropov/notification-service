import type {
  CheckHealthUseCase,
  CheckHealthUseCaseDependencies,
} from "./interfaces/index.js";

export const createCheckHealthUseCase = (
  dependencies: CheckHealthUseCaseDependencies,
): CheckHealthUseCase => {
  const { deliveryService, producer, batchConsumer } =
    dependencies;

  const checkHealth = async (): Promise<void> => {
    const promises: Promise<void>[] = [];

    if (deliveryService.checkHealth) {
      promises.push(deliveryService.checkHealth());
    }

    if (producer.checkHealth) {
      promises.push(producer.checkHealth());
    }

    if (batchConsumer.checkHealth) {
      promises.push(batchConsumer.checkHealth());
    }

    await Promise.all(promises);
  };

  return {
    checkHealth,
  };
};
