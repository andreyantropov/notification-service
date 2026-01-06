import type {
  CheckHealthUseCase,
  CheckHealthUseCaseDependencies,
} from "./interfaces/index.js";

export const createCheckHealthUseCase = (
  dependencies: CheckHealthUseCaseDependencies,
): CheckHealthUseCase => {
  const { retryConsumer } =
    dependencies;

  const checkHealth = async (): Promise<void> => {
    const promises: Promise<void>[] = [];

    if (retryConsumer.checkHealth) {
      promises.push(retryConsumer.checkHealth());
    }

    await Promise.all(promises);
  };

  return {
    checkHealth,
  };
};
