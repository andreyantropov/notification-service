import { metrics } from "@opentelemetry/api";

import { MeterConfig } from "./interfaces/MeterConfig.js";
import { Meter } from "../../../../../application/ports/Meter.js";

export const createMeter = (config: MeterConfig): Meter => {
  const { serviceName } = config;
  const meter = metrics.getMeter(serviceName);

  const totalNotificationsCounter = meter.createCounter("notifications_total", {
    description: "Общее количество уведомлений, обработанных сервисом",
  });
  const incrementTotalNotifications = (): void => {
    totalNotificationsCounter.add(1);
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
    processedByResultCounter.add(1, { result });
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
    processedBySubjectCounter.add(1, { subjectId });
  };

  const processedByStrategyCounter = meter.createCounter(
    "notifications_processed_by_strategy_total",
    {
      description: "Общее количество обработанных уведомлений по стратегии",
    },
  );
  const incrementNotificationsProcessedByStrategy = (
    strategy: string,
  ): void => {
    processedByStrategyCounter.add(1, { strategy });
  };

  const processedByPriorityCounter = meter.createCounter(
    "notifications_processed_by_priority_total",
    {
      description:
        "Общее количество обработанных уведомлений по признаку срочности (isImmediate)",
    },
  );
  const incrementNotificationsByPriority = (isImmediate: boolean): void => {
    processedByPriorityCounter.add(1, { isImmediate });
  };

  const channelLatencyHistogram = meter.createHistogram("channel_latency_ms", {
    description: "Время выполнения channel.send() в миллисекундах",
  });
  const recordChannelLatency = (
    latency: number,
    attributes: Record<string, string | boolean>,
  ): void => {
    channelLatencyHistogram.record(latency, attributes);
  };

  const byChannelCounter = meter.createCounter(
    "notifications_by_channel_total",
    {
      description:
        "Общее количество уведомлений по каналу отправки и результату",
    },
  );
  const incrementNotificationsByChannel = (
    channel: string,
    result: "success" | "failure",
  ): void => {
    byChannelCounter.add(1, { channel, result });
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
