import { SendNotificationProcess } from "./interfaces/SendNotificationProcess.js";
import { SendNotificationProcessConfig } from "./interfaces/SendNotificationProcessConfig.js";
import { SendNotificationProcessDependencies } from "./interfaces/SendNotificationProcessDependencies.js";
import { DEFAULT_CONFIG } from "../../../shared/constants/defaults.js";

const DEFAULT_INTERVAL = 60_000;
const CHECK_IS_PROCESSING_TIMEOUT = 100;

export const createSendNotificationProcess = (
  dependencies: SendNotificationProcessDependencies,
  config: SendNotificationProcessConfig = DEFAULT_CONFIG,
): SendNotificationProcess => {
  const { buffer, notificationDeliveryService } = dependencies;
  const { interval = DEFAULT_INTERVAL, onError = () => {} } = config;

  let timer: ReturnType<typeof setInterval> | null = null;
  let isProcessing = false;
  let isShuttingDown = false;

  const processBufferedNotifications = async (): Promise<void> => {
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
    }
  };

  const run = async (): Promise<void> => {
    if (isProcessing || isShuttingDown) return;

    isProcessing = true;

    try {
      await processBufferedNotifications();
    } finally {
      isProcessing = false;
    }
  };

  const start = (): void => {
    if (timer) return;
    timer = setInterval(run, interval);
  };

  const shutdown = async (): Promise<void> => {
    isShuttingDown = true;

    if (timer) {
      clearInterval(timer);
      timer = null;
    }

    while (isProcessing) {
      await new Promise((resolve) =>
        setTimeout(resolve, CHECK_IS_PROCESSING_TIMEOUT),
      );
    }

    await processBufferedNotifications();
  };

  return {
    start,
    shutdown,
  };
};
