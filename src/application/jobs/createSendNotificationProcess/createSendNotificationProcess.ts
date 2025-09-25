import { context } from "@opentelemetry/api";

import { SendNotificationProcess } from "./interfaces/SendNotificationProcess.js";
import { SendNotificationProcessConfig } from "./interfaces/SendNotificationProcessConfig.js";
import { SendNotificationProcessDependencies } from "./interfaces/SendNotificationProcessDependencies.js";
import {
  DEFAULT_CONFIG,
  DEFAULT_LOGGER,
} from "../../../shared/constants/defaults.js";
import { EventType } from "../../../shared/enums/EventType.js";

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
      const bufferedNotifications = await buffer.takeAll();
      if (bufferedNotifications.length === 0) return;

      for (const buffered of bufferedNotifications) {
        const { notification, otelContext } = buffered;

        await context.with(otelContext, async () => {
          try {
            const results = await notificationDeliveryService.send([
              notification,
            ]);
            const isErrors = results.some((res) => !res.success);
            const isWarnings = results.some(
              (res) => res.warnings && res.warnings.length !== 0,
            );

            if (isErrors) {
              loggerAdapter.error({
                message: `Не удалось отправить одно или несколько уведомлений`,
                eventType: EventType.MessagePublish,
                details: results,
              });
            } else if (isWarnings) {
              loggerAdapter.warning({
                message: `Уведомление отправлено, но в ходе работы возникли ошибки`,
                eventType: EventType.MessagePublish,
                details: results,
              });
            } else {
              loggerAdapter.info({
                message: `Уведомление успешно отправлено`,
                eventType: EventType.MessagePublish,
                details: results,
              });
            }
          } catch (error) {
            loggerAdapter.error({
              message: `Не удалось отправить уведомления`,
              eventType: EventType.MessagePublish,
              details: [buffered.notification],
              error,
            });
          }
        });
      }
    } catch (error) {
      loggerAdapter.error({
        message: `Не удалось обработать буфер уведомлений`,
        eventType: EventType.MessagePublish,
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
