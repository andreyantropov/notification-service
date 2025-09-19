import { SendNotificationProcess } from "./interfaces/SendNotificationProcess.js";
import { SendNotificationProcessConfig } from "./interfaces/SendNotificationProcessConfig.js";
import { SendNotificationProcessDependencies } from "./interfaces/SendNotificationProcessDependencies.js";
import {
  DEFAULT_CONFIG,
  DEFAULT_LOGGER,
} from "../../../shared/constants/defaults.js";
import { EventType } from "../../../shared/enums/EventType.js";
import { LogLevel } from "../../../shared/enums/LogLevel.js";

const DEFAULT_INTERVAL = 60_000;

export const createSendNotificationProcess = (
  dependencies: SendNotificationProcessDependencies,
  config: SendNotificationProcessConfig = DEFAULT_CONFIG,
): SendNotificationProcess => {
  const {
    buffer,
    notificationDeliveryService,
    loggerAdapter = DEFAULT_LOGGER,
  } = dependencies;
  const { interval = DEFAULT_INTERVAL } = config;

  let timer: ReturnType<typeof setInterval> | null = null;
  let isProcessing = false;

  const run = async () => {
    if (isProcessing) return;
    isProcessing = true;

    try {
      const notifications = await buffer.takeAll();
      if (notifications.length === 0) return;

      const results = await notificationDeliveryService.send(notifications);
      const isErrors = results.some((res) => !res.success);
      const isWarnings = results.some(
        (res) => res.warnings && res.warnings.length !== 0,
      );

      if (isErrors) {
        loggerAdapter.writeLog({
          level: LogLevel.Error,
          message: `Не удалось отправить одно или несколько уведомлений`,
          eventType: EventType.NotificationError,
          spanId: `createSendNotificationProcess`,
          payload: results,
        });
      } else if (isWarnings) {
        loggerAdapter.writeLog({
          level: LogLevel.Warning,
          message: `Уведомление отправлено, но в ходе работы возникли ошибки`,
          eventType: EventType.NotificationWarning,
          spanId: `createSendNotificationProcess`,
          payload: results,
        });
      } else {
        loggerAdapter.writeLog({
          level: LogLevel.Info,
          message: `Уведомление успешно отправлено`,
          eventType: EventType.NotificationSuccess,
          spanId: `createSendNotificationProcess`,
          payload: results,
        });
      }
    } catch (error) {
      loggerAdapter.writeLog({
        level: LogLevel.Error,
        message: `Не удалось отправить уведомление`,
        eventType: EventType.NotificationError,
        spanId: `createSendNotificationProcess`,
        error,
      });
    } finally {
      isProcessing = false;
    }
  };

  const start = () => {
    if (timer) return;
    timer = setInterval(run, interval);
  };

  const stop = () => {
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
