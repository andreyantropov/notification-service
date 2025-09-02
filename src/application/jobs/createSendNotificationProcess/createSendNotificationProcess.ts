import { Notification } from "../../../domain/types/Notification.js";
import { EventType } from "../../../shared/enums/EventType.js";
import { LogLevel } from "../../../shared/enums/LogLevel.js";
import { Buffer } from "../../ports/Buffer.js";
import { LoggerAdapter } from "../../ports/LoggerAdapter.js";
import { NotificationDeliveryService } from "../../services/createNotificationDeliveryService/index.js";
import { SendNotificationProcess } from "./interfaces/SendNotificationProcess.js";
import { SendNotificationProcessConfig } from "./interfaces/SendNotificationProcessConfig.js";

const DEFAULT_INTERVAL = 60_000;

export const createSendNotificationProcess = (
  buffer: Buffer<Notification>,
  notificationDeliveryService: NotificationDeliveryService,
  loggerAdapter: LoggerAdapter,
  config?: SendNotificationProcessConfig,
): SendNotificationProcess => {
  const { interval = DEFAULT_INTERVAL } = config || {};
  let timer: ReturnType<typeof setInterval> | null = null;
  let isProcessing = false;

  const run = async () => {
    if (isProcessing) return;
    isProcessing = true;

    try {
      const notifications = await buffer.takeAll();
      if (notifications.length === 0) return;

      const results = await notificationDeliveryService.send(notifications);

      if (results.some((res) => !res.success)) {
        loggerAdapter.writeLog({
          level: LogLevel.Error,
          message: `Не удалось отправить уведомление`,
          eventType: EventType.NotificationError,
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
