import { metrics } from "@opentelemetry/api";
import { describe, it, expect, vi, beforeEach, Mock } from "vitest";

import { createMeter } from "./createMeter.js";
import { Meter } from "../../../application/ports/index.js";
import {
  CHANNEL_TYPES,
  DELIVERY_STRATEGIES,
} from "../../../domain/types/index.js";
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

  describe("incrementNotificationsByChannel", () => {
    it("should increment counter with correct transformed channel and result attributes for success", () => {
      const meter: Meter = createMeter(mockConfig);
      const channel = CHANNEL_TYPES.EMAIL;
      const result = "success" as const;
      const originalAttrs = { channel, result };

      meter.incrementNotificationsByChannel(channel, result);

      expect(mockMeter.createCounter).toHaveBeenCalledWith(
        "notifications_by_channel_total",
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

    it("should increment counter with correct transformed channel and result attributes for failure", () => {
      const meter: Meter = createMeter(mockConfig);
      const channel = CHANNEL_TYPES.BITRIX;
      const result = "failure" as const;
      const originalAttrs = { channel, result };

      meter.incrementNotificationsByChannel(channel, result);

      expect(mockCounter.add).toHaveBeenCalledWith(
        1,
        mapKeysToSnakeCase(originalAttrs),
      );
    });

    it("should handle different valid channels and results", () => {
      const meter: Meter = createMeter(mockConfig);
      const testCases = [
        { channel: CHANNEL_TYPES.EMAIL, result: "success" as const },
        { channel: CHANNEL_TYPES.BITRIX, result: "failure" as const },
        { channel: CHANNEL_TYPES.EMAIL, result: "failure" as const },
        { channel: CHANNEL_TYPES.BITRIX, result: "success" as const },
      ];

      testCases.forEach(({ channel, result }) => {
        const originalAttrs = { channel, result };
        mockCounter.add.mockClear();
        meter.incrementNotificationsByChannel(channel, result);
        expect(mockCounter.add).toHaveBeenCalledWith(
          1,
          mapKeysToSnakeCase(originalAttrs),
        );
      });
    });
  });

  describe("incrementTotalNotifications", () => {
    it("should increment total notifications counter", () => {
      const meter: Meter = createMeter(mockConfig);
      meter.incrementTotalNotifications();
      expect(mockMeter.createCounter).toHaveBeenCalledWith(
        "notifications_total",
        {
          description: "Общее количество уведомлений, обработанных сервисом",
        },
      );
      expect(mockCounter.add).toHaveBeenCalledWith(1);
    });

    it("should handle multiple increments", () => {
      const meter: Meter = createMeter(mockConfig);
      meter.incrementTotalNotifications();
      meter.incrementTotalNotifications();
      meter.incrementTotalNotifications();
      expect(mockCounter.add).toHaveBeenCalledTimes(3);
    });
  });

  describe("incrementNotificationsProcessedByResult", () => {
    it("should increment counter with correct transformed result attribute for success", () => {
      const meter: Meter = createMeter(mockConfig);
      const result = "success" as const;
      meter.incrementNotificationsProcessedByResult(result);
      expect(mockMeter.createCounter).toHaveBeenCalledWith(
        "notifications_processed_by_result_total",
        {
          description:
            "Общее количество уведомлений, обработанных сервисом, по результату",
        },
      );
      expect(mockCounter.add).toHaveBeenCalledWith(
        1,
        mapKeysToSnakeCase({ result }),
      );
    });

    it("should handle different results", () => {
      const meter: Meter = createMeter(mockConfig);
      const results = ["success", "failure"] as const;
      results.forEach((result) => {
        const originalAttrs = { result };
        mockCounter.add.mockClear();
        meter.incrementNotificationsProcessedByResult(result);
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
      const strategy = DELIVERY_STRATEGIES.SEND_TO_FIRST_AVAILABLE;
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
        DELIVERY_STRATEGIES.SEND_TO_FIRST_AVAILABLE,
        DELIVERY_STRATEGIES.SEND_TO_ALL_AVAILABLE,
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

  describe("incrementNotificationsByPriority", () => {
    it("should increment counter with transformed isImmediate true for immediate notifications", () => {
      const meter: Meter = createMeter(mockConfig);
      const isImmediate = true;
      meter.incrementNotificationsByPriority(isImmediate);
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
      meter.incrementNotificationsByPriority(true);
      expect(mockCounter.add).toHaveBeenCalledWith(
        1,
        mapKeysToSnakeCase({ isImmediate: true }),
      );
      mockCounter.add.mockClear();
      meter.incrementNotificationsByPriority(false);
      expect(mockCounter.add).toHaveBeenCalledWith(
        1,
        mapKeysToSnakeCase({ isImmediate: false }),
      );
    });
  });

  it("should create all metrics instruments only once", () => {
    createMeter(mockConfig);
    expect(mockMeter.createHistogram).toHaveBeenCalledOnce();
    expect(mockMeter.createCounter).toHaveBeenCalledTimes(6);
  });

  it("should return all meter functions", () => {
    const meter: Meter = createMeter(mockConfig);
    const expectedMethods = [
      "recordChannelLatency",
      "incrementNotificationsByChannel",
      "incrementTotalNotifications",
      "incrementNotificationsProcessedByResult",
      "incrementNotificationsProcessedBySubject",
      "incrementNotificationsProcessedByStrategy",
      "incrementNotificationsByPriority",
    ] as const;
    expectedMethods.forEach((method) => {
      expect(meter).toHaveProperty(method);
      expect(typeof meter[method]).toBe("function");
    });
  });
});
