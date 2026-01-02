import { metrics } from "@opentelemetry/api";
import { describe, it, expect, vi, beforeEach, Mock } from "vitest";

import { createMeter } from "./createMeter.js";
import type { Meter } from "../../../application/ports/index.js";
import { CHANNEL_TYPES } from "../../../domain/constants/index.js";
import { DeliveryStrategy } from "../../../domain/enums/DeliveryStrategy.js";
import { mapKeysToSnakeCase } from "../../../shared/utils/index.js";

vi.mock("@opentelemetry/api", () => ({
  metrics: {
    getMeter: vi.fn(),
  },
}));

describe("createMeter", () => {
  const mockHistogram = {
    record: vi.fn(),
  };

  const mockCounter = {
    add: vi.fn(),
  };

  const mockMeter = {
    createHistogram: vi.fn().mockReturnValue(mockHistogram),
    createCounter: vi.fn().mockReturnValue(mockCounter),
  };

  const mockConfig = {
    serviceName: "test-service",
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (metrics.getMeter as Mock).mockReturnValue(mockMeter);
    mockMeter.createHistogram.mockReturnValue(mockHistogram);
    mockMeter.createCounter.mockReturnValue(mockCounter);
  });

  it("should create meter with correct name", () => {
    createMeter(mockConfig);
    expect(metrics.getMeter).toHaveBeenCalledWith(mockConfig.serviceName);
  });

  describe("recordChannelLatency", () => {
    it("should record latency with correct histogram and transformed attributes", () => {
      const meter: Meter = createMeter(mockConfig);
      const latency = 150;
      const originalAttributes = {
        channelType: CHANNEL_TYPES.EMAIL,
        success: true,
      };

      meter.recordChannelLatency(latency, originalAttributes);

      expect(mockMeter.createHistogram).toHaveBeenCalledWith(
        "channel_latency_ms",
        {
          description: "Время выполнения channel.send() в миллисекундах",
        },
      );
      expect(mockHistogram.record).toHaveBeenCalledWith(
        latency,
        mapKeysToSnakeCase(originalAttributes),
      );
    });

    it("should handle different latency values and valid channel types", () => {
      const meter: Meter = createMeter(mockConfig);
      const testCases = [
        {
          latency: 0,
          attributes: { channelType: CHANNEL_TYPES.EMAIL, success: false },
        },
        {
          latency: 1000,
          attributes: { channelType: CHANNEL_TYPES.BITRIX, success: true },
        },
        {
          latency: 42.5,
          attributes: { channelType: CHANNEL_TYPES.EMAIL, success: true },
        },
      ];

      testCases.forEach(({ latency, attributes }) => {
        mockHistogram.record.mockClear();
        meter.recordChannelLatency(latency, attributes);
        expect(mockHistogram.record).toHaveBeenCalledWith(
          latency,
          mapKeysToSnakeCase(attributes),
        );
      });
    });
  });

  describe("incrementNotificationsProcessedByChannel", () => {
    it("should increment counter with correct transformed channel and status attributes for success", () => {
      const meter: Meter = createMeter(mockConfig);
      const channel = CHANNEL_TYPES.EMAIL;
      const status = "success" as const;
      const originalAttrs = { channel, status };

      meter.incrementNotificationsProcessedByChannel(channel, status);

      expect(mockMeter.createCounter).toHaveBeenCalledWith(
        "notifications_processed_by_channel_total",
        {
          description:
            "Общее количество уведомлений по каналу отправки и результату",
        },
      );
      expect(mockCounter.add).toHaveBeenCalledWith(
        1,
        mapKeysToSnakeCase(originalAttrs),
      );
    });

    it("should increment counter with correct transformed channel and status attributes for failure", () => {
      const meter: Meter = createMeter(mockConfig);
      const channel = CHANNEL_TYPES.BITRIX;
      const status = "failure" as const;
      const originalAttrs = { channel, status };

      meter.incrementNotificationsProcessedByChannel(channel, status);

      expect(mockCounter.add).toHaveBeenCalledWith(
        1,
        mapKeysToSnakeCase(originalAttrs),
      );
    });

    it("should handle different valid channels and results", () => {
      const meter: Meter = createMeter(mockConfig);
      const testCases = [
        { channel: CHANNEL_TYPES.EMAIL, status: "success" as const },
        { channel: CHANNEL_TYPES.BITRIX, status: "failure" as const },
        { channel: CHANNEL_TYPES.EMAIL, status: "failure" as const },
        { channel: CHANNEL_TYPES.BITRIX, status: "success" as const },
      ];

      testCases.forEach(({ channel, status }) => {
        const originalAttrs = { channel, status };
        mockCounter.add.mockClear();
        meter.incrementNotificationsProcessedByChannel(channel, status);
        expect(mockCounter.add).toHaveBeenCalledWith(
          1,
          mapKeysToSnakeCase(originalAttrs),
        );
      });
    });
  });

  describe("incrementNotificationsProcessedTotal", () => {
    it("should increment total notifications counter", () => {
      const meter: Meter = createMeter(mockConfig);
      meter.incrementNotificationsProcessedTotal();
      expect(mockMeter.createCounter).toHaveBeenCalledWith(
        "notifications_processed_total",
        {
          description: "Общее количество уведомлений, обработанных сервисом",
        },
      );
      expect(mockCounter.add).toHaveBeenCalledWith(1);
    });

    it("should handle multiple increments", () => {
      const meter: Meter = createMeter(mockConfig);
      meter.incrementNotificationsProcessedTotal();
      meter.incrementNotificationsProcessedTotal();
      meter.incrementNotificationsProcessedTotal();
      expect(mockCounter.add).toHaveBeenCalledTimes(3);
    });
  });

  describe("incrementNotificationsProcessedByResult", () => {
    it("should increment counter with correct transformed status attribute for success", () => {
      const meter: Meter = createMeter(mockConfig);
      const status = "success" as const;
      meter.incrementNotificationsProcessedByResult(status);
      expect(mockMeter.createCounter).toHaveBeenCalledWith(
        "notifications_processed_by_result_total",
        {
          description:
            "Общее количество уведомлений, обработанных сервисом, по результату",
        },
      );
      expect(mockCounter.add).toHaveBeenCalledWith(
        1,
        mapKeysToSnakeCase({ status }),
      );
    });

    it("should handle different results", () => {
      const meter: Meter = createMeter(mockConfig);
      const results = ["success", "failure"] as const;
      results.forEach((status) => {
        const originalAttrs = { status };
        mockCounter.add.mockClear();
        meter.incrementNotificationsProcessedByResult(status);
        expect(mockCounter.add).toHaveBeenCalledWith(
          1,
          mapKeysToSnakeCase(originalAttrs),
        );
      });
    });
  });

  describe("incrementNotificationsProcessedBySubject", () => {
    it("should increment counter with correct transformed subjectId attribute", () => {
      const meter: Meter = createMeter(mockConfig);
      const subjectId = "user-123";
      meter.incrementNotificationsProcessedBySubject(subjectId);
      expect(mockMeter.createCounter).toHaveBeenCalledWith(
        "notifications_processed_by_subject_total",
        {
          description:
            "Общее количество обработанных уведомлений по subject.id",
        },
      );
      expect(mockCounter.add).toHaveBeenCalledWith(
        1,
        mapKeysToSnakeCase({ subjectId }),
      );
    });

    it("should handle different subject IDs", () => {
      const meter: Meter = createMeter(mockConfig);
      const subjectIds = ["user-123", "user-456", "admin-789"];
      subjectIds.forEach((subjectId) => {
        const originalAttrs = { subjectId };
        mockCounter.add.mockClear();
        meter.incrementNotificationsProcessedBySubject(subjectId);
        expect(mockCounter.add).toHaveBeenCalledWith(
          1,
          mapKeysToSnakeCase(originalAttrs),
        );
      });
    });
  });

  describe("incrementNotificationsProcessedByStrategy", () => {
    it("should increment counter with correct transformed strategy attribute", () => {
      const meter: Meter = createMeter(mockConfig);
      const strategy = DeliveryStrategy.sendToFirstAvailable;
      meter.incrementNotificationsProcessedByStrategy(strategy);
      expect(mockMeter.createCounter).toHaveBeenCalledWith(
        "notifications_processed_by_strategy_total",
        {
          description: "Общее количество обработанных уведомлений по стратегии",
        },
      );
      expect(mockCounter.add).toHaveBeenCalledWith(
        1,
        mapKeysToSnakeCase({ strategy }),
      );
    });

    it("should handle different valid strategies", () => {
      const meter: Meter = createMeter(mockConfig);
      const strategies = [
        DeliveryStrategy.sendToFirstAvailable,
        DeliveryStrategy.sendToAllAvailable,
      ];
      strategies.forEach((strategy) => {
        const originalAttrs = { strategy };
        mockCounter.add.mockClear();
        meter.incrementNotificationsProcessedByStrategy(strategy);
        expect(mockCounter.add).toHaveBeenCalledWith(
          1,
          mapKeysToSnakeCase(originalAttrs),
        );
      });
    });
  });

  describe("incrementNotificationsProcessedByPriority", () => {
    it("should increment counter with transformed isImmediate true for immediate notifications", () => {
      const meter: Meter = createMeter(mockConfig);
      const isImmediate = true;
      meter.incrementNotificationsProcessedByPriority(isImmediate);
      expect(mockMeter.createCounter).toHaveBeenCalledWith(
        "notifications_processed_by_priority_total",
        {
          description:
            "Общее количество обработанных уведомлений по признаку срочности (isImmediate)",
        },
      );
      expect(mockCounter.add).toHaveBeenCalledWith(
        1,
        mapKeysToSnakeCase({ isImmediate }),
      );
    });

    it("should handle both priority types", () => {
      const meter: Meter = createMeter(mockConfig);
      meter.incrementNotificationsProcessedByPriority(true);
      expect(mockCounter.add).toHaveBeenCalledWith(
        1,
        mapKeysToSnakeCase({ isImmediate: true }),
      );
      mockCounter.add.mockClear();
      meter.incrementNotificationsProcessedByPriority(false);
      expect(mockCounter.add).toHaveBeenCalledWith(
        1,
        mapKeysToSnakeCase({ isImmediate: false }),
      );
    });
  });

  it("should create all metrics instruments only once", () => {
    createMeter(mockConfig);
    expect(mockMeter.createHistogram).toHaveBeenCalledOnce();
    expect(mockMeter.createCounter).toHaveBeenCalledTimes(7);
  });

  it("should return all meter functions", () => {
    const meter: Meter = createMeter(mockConfig);
    const expectedMethods = [
      "recordChannelLatency",
      "incrementNotificationsProcessedByChannel",
      "incrementNotificationsProcessedTotal",
      "incrementNotificationsProcessedByResult",
      "incrementNotificationsProcessedBySubject",
      "incrementNotificationsProcessedByStrategy",
      "incrementNotificationsProcessedByPriority",
      "incrementRetryRoutingByQueue",
    ] as const;
    expectedMethods.forEach((method) => {
      expect(meter).toHaveProperty(method);
      expect(typeof meter[method]).toBe("function");
    });
  });

  describe("incrementRetryRoutingByQueue", () => {
    it("should increment retry routing counter with correct transformed queue attribute", () => {
      const meter: Meter = createMeter(mockConfig);
      const queue = "notifications.retry.30m";

      meter.incrementRetryRoutingByQueue(queue);

      expect(mockMeter.createCounter).toHaveBeenCalledWith(
        "notifications_retry_routing_total",
        {
          description:
            "Количество сообщений, направленных в retry-очередь или DLQ",
        },
      );
      expect(mockCounter.add).toHaveBeenCalledWith(
        1,
        mapKeysToSnakeCase({ queue }),
      );
    });

    it("should handle different queue types including DLQ", () => {
      const meter: Meter = createMeter(mockConfig);
      const queues = [
        "notifications.retry.30m",
        "notifications.retry.2h",
        "notifications.dlq",
      ];

      queues.forEach((queue) => {
        mockCounter.add.mockClear();
        meter.incrementRetryRoutingByQueue(queue);
        expect(mockCounter.add).toHaveBeenCalledWith(
          1,
          mapKeysToSnakeCase({ queue }),
        );
      });
    });

    it("should treat queue name as string attribute without validation", () => {
      const meter: Meter = createMeter(mockConfig);
      const unknownQueue = "some.unknown.queue.name";

      meter.incrementRetryRoutingByQueue(unknownQueue);

      expect(mockCounter.add).toHaveBeenCalledWith(
        1,
        mapKeysToSnakeCase({ queue: unknownQueue }),
      );
    });
  });
});
