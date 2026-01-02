import type { Attributes, Counter } from "@opentelemetry/api";
import { metrics } from "@opentelemetry/api";

import type { MeterConfig } from "./interfaces/index.js";
import type { Meter } from "../../../application/ports/index.js";
import type { DeliveryStrategy } from "../../../domain/enums/index.js";
import type { ChannelType } from "../../../domain/types/index.js";
import { mapKeysToSnakeCase } from "../../../shared/utils/index.js";

export const createMeter = (config: MeterConfig): Meter => {
  const { serviceName } = config;
  const meter = metrics.getMeter(serviceName);

  const addWithSnakeCaseAttributes = (
    counter: Counter<Attributes>,
    value: number,
    attributes?: Record<string, string | boolean>,
  ): void => {
    if (attributes) {
      counter.add(value, mapKeysToSnakeCase(attributes));
    } else {
      counter.add(value);
    }
  };

  const notificationProcessedTotalCounter = meter.createCounter(
    "notifications_processed_total",
    {
      description: "Общее количество уведомлений, обработанных сервисом",
    },
  );
  const incrementNotificationsProcessedTotal = (): void => {
    addWithSnakeCaseAttributes(notificationProcessedTotalCounter, 1);
  };

  const notificationProcessedByResultCounter = meter.createCounter(
    "notifications_processed_by_result_total",
    {
      description:
        "Общее количество уведомлений, обработанных сервисом, по результату",
    },
  );

  const incrementNotificationsProcessedByResult = (
    status: "success" | "failure",
  ): void => {
    addWithSnakeCaseAttributes(notificationProcessedByResultCounter, 1, {
      status,
    });
  };

  const notificationProcessedBySubjectCounter = meter.createCounter(
    "notifications_processed_by_subject_total",
    {
      description: "Общее количество обработанных уведомлений по subject.id",
    },
  );
  const incrementNotificationsProcessedBySubject = (
    subjectId: string,
  ): void => {
    addWithSnakeCaseAttributes(notificationProcessedBySubjectCounter, 1, {
      subjectId,
    });
  };

  const notificationProcessedByStrategyCounter = meter.createCounter(
    "notifications_processed_by_strategy_total",
    {
      description: "Общее количество обработанных уведомлений по стратегии",
    },
  );
  const incrementNotificationsProcessedByStrategy = (
    strategy: DeliveryStrategy,
  ): void => {
    addWithSnakeCaseAttributes(notificationProcessedByStrategyCounter, 1, {
      strategy,
    });
  };

  const notificationProcessedByPriorityCounter = meter.createCounter(
    "notifications_processed_by_priority_total",
    {
      description:
        "Общее количество обработанных уведомлений по признаку срочности (isImmediate)",
    },
  );
  const incrementNotificationsProcessedByPriority = (
    isImmediate: boolean,
  ): void => {
    addWithSnakeCaseAttributes(notificationProcessedByPriorityCounter, 1, {
      isImmediate,
    });
  };

  const retryRoutingByQueueCounter = meter.createCounter(
    "notifications_retry_routing_total",
    {
      description: "Количество сообщений, направленных в retry-очередь или DLQ",
    },
  );
  const incrementRetryRoutingByQueue = (queue: string): void => {
    addWithSnakeCaseAttributes(retryRoutingByQueueCounter, 1, { queue });
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

  const notificationProcessedByChannelCounter = meter.createCounter(
    "notifications_processed_by_channel_total",
    {
      description:
        "Общее количество уведомлений по каналу отправки и результату",
    },
  );
  const incrementNotificationsProcessedByChannel = (
    channel: ChannelType,
    status: "success" | "failure",
  ): void => {
    addWithSnakeCaseAttributes(notificationProcessedByChannelCounter, 1, {
      channel,
      status,
    });
  };

  return {
    incrementNotificationsProcessedTotal,
    incrementNotificationsProcessedByResult,
    incrementNotificationsProcessedBySubject,
    incrementNotificationsProcessedByStrategy,
    incrementNotificationsProcessedByPriority,
    incrementRetryRoutingByQueue,

    recordChannelLatency,
    incrementNotificationsProcessedByChannel,
  };
};
