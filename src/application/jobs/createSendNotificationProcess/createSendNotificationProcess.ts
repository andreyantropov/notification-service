import { SendNotificationProcess } from "./interfaces/SendNotificationProcess.js";
import { SendNotificationProcessConfig } from "./interfaces/SendNotificationProcessConfig.js";
import { SendNotificationProcessDependencies } from "./interfaces/SendNotificationProcessDependencies.js";
import { DEFAULT_CONFIG } from "../../../shared/constants/defaults.js";

const DEFAULT_INTERVAL = 60_000;

export const createSendNotificationProcess = (
  dependencies: SendNotificationProcessDependencies,
  config: SendNotificationProcessConfig = DEFAULT_CONFIG,
): SendNotificationProcess => {
  const { buffer, notificationDeliveryService } = dependencies;
  const { interval = DEFAULT_INTERVAL, onError = () => {} } = config;

  let timer: ReturnType<typeof setInterval> | null = null;
  let isProcessing = false;

  const run = async (): Promise<void> => {
    if (isProcessing) return;

    isProcessing = true;

    try {
      const notifications = await buffer.takeAll();
      if (notifications.length === 0) return;

      await notificationDeliveryService.send(notifications);
    } catch (error) {
      onError(
        new Error(`При обработке отложенных уведомлений произошла ошибка`, {
          cause: error,
        }),
      );
    } finally {
      isProcessing = false;
    }
  };

  const start = (): void => {
    if (timer) return;
    timer = setInterval(run, interval);
  };

  const stop = (): void => {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
  };

  return {
    start,
    stop,
  };
};
