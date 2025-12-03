import { metrics } from "@opentelemetry/api";

import { MeterConfig } from "./interfaces/index.js";
import { Meter } from "../../../application/ports/index.js";
import {
  ChannelTypes,
  DeliveryStrategies,
} from "../../../domain/types/index.js";
import { mapKeysToSnakeCase } from "../../../shared/utils/index.js";

export const createMeter = (config: MeterConfig): Meter => {
  const { serviceName } = config;
  const meter = metrics.getMeter(serviceName);

  const addWithSnakeCaseAttributes = (
    counter: typeof processedByResultCounter,
    value: number,
    attributes?: Record<string, string | boolean>,
  ): void => {
    if (attributes) {
      counter.add(value, mapKeysToSnakeCase(attributes));
    } else {
      counter.add(value);
    }
  };

  const totalNotificationsCounter = meter.createCounter("notifications_total", {
    description: "Общее количество уведомлений, обработанных сервисом",
  });
  const incrementTotalNotifications = (): void => {
    addWithSnakeCaseAttributes(totalNotificationsCounter, 1);
  };

  const processedByResultCounter = meter.createCounter(
    "notifications_processed_by_result_total",
    {
      description:
        "Общее количество уведомлений, обработанных сервисом, по результату",
    },
  );

  const incrementNotificationsProcessedByResult = (
    result: "success" | "failure",
  ): void => {
    addWithSnakeCaseAttributes(processedByResultCounter, 1, { result });
  };

  const processedBySubjectCounter = meter.createCounter(
    "notifications_processed_by_subject_total",
    {
      description: "Общее количество обработанных уведомлений по subject.id",
    },
  );
  const incrementNotificationsProcessedBySubject = (
    subjectId: string,
  ): void => {
    addWithSnakeCaseAttributes(processedBySubjectCounter, 1, { subjectId });
  };

  const processedByStrategyCounter = meter.createCounter(
    "notifications_processed_by_strategy_total",
    {
      description: "Общее количество обработанных уведомлений по стратегии",
    },
  );
  const incrementNotificationsProcessedByStrategy = (
    strategy: DeliveryStrategies,
  ): void => {
    addWithSnakeCaseAttributes(processedByStrategyCounter, 1, { strategy });
  };

  const processedByPriorityCounter = meter.createCounter(
    "notifications_processed_by_priority_total",
    {
      description:
        "Общее количество обработанных уведомлений по признаку срочности (isImmediate)",
    },
  );
  const incrementNotificationsByPriority = (isImmediate: boolean): void => {
    addWithSnakeCaseAttributes(processedByPriorityCounter, 1, { isImmediate });
  };

  const channelLatencyHistogram = meter.createHistogram("channel_latency_ms", {
    description: "Время выполнения channel.send() в миллисекундах",
  });
  const recordChannelLatency = (
    latency: number,
    attributes: Record<string, string | boolean>,
  ): void => {
    channelLatencyHistogram.record(latency, mapKeysToSnakeCase(attributes));
  };

  const byChannelCounter = meter.createCounter(
    "notifications_by_channel_total",
    {
      description:
        "Общее количество уведомлений по каналу отправки и результату",
    },
  );
  const incrementNotificationsByChannel = (
    channel: ChannelTypes,
    result: "success" | "failure",
  ): void => {
    addWithSnakeCaseAttributes(byChannelCounter, 1, { channel, result });
  };

  return {
    incrementTotalNotifications,
    incrementNotificationsProcessedByResult,
    incrementNotificationsProcessedBySubject,
    incrementNotificationsProcessedByStrategy,
    incrementNotificationsByPriority,

    recordChannelLatency,
    incrementNotificationsByChannel,
  };
};
