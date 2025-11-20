import { metrics } from "@opentelemetry/api";
import { describe, it, expect, vi, beforeEach, Mock } from "vitest";

import { createMeter } from "./createMeter.js";
import { mapKeysToSnakeCase } from "../../../../../shared/utils/toSnakeCase/toSnakeCase.js";

vi.mock("@opentelemetry/api", () => ({
  metrics: {
    getMeter: vi.fn(),
  },
}));

vi.mock("../../../../../shared/utils/toSnakeCase/toSnakeCase.js", async () => {
  const actual = await vi.importActual(
    "../../../../../shared/utils/toSnakeCase/toSnakeCase.js",
  );
  return {
    ...actual,
    mapKeysToSnakeCase: vi.fn((obj) => obj),
  };
});

describe("createMeter", () => {
  const mockHistogram = {
    record: vi.fn(),
  };

  const mockCounter = {
    add: vi.fn(),
  };

  const mockMeter = {
    createHistogram: vi.fn(),
    createCounter: vi.fn(),
  };

  const mockConfig = {
    serviceName: "test-service",
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(mapKeysToSnakeCase).mockImplementation((obj) => obj);
    (metrics.getMeter as Mock).mockReturnValue(mockMeter);
    mockMeter.createHistogram.mockReturnValue(mockHistogram);
    mockMeter.createCounter.mockReturnValue(mockCounter);
  });

  it("should create meter with correct name", () => {
    createMeter(mockConfig);

    expect(metrics.getMeter).toHaveBeenCalledOnce();
    expect(metrics.getMeter).toHaveBeenCalledWith(mockConfig.serviceName);
  });

  describe("recordChannelLatency", () => {
    it("should record latency with correct histogram and transformed attributes", () => {
      const meter = createMeter(mockConfig);
      const latency = 150;
      const originalAttributes = { channelType: "email", success: true };
      const transformedAttributes = { channel_type: "email", success: true };

      vi.mocked(mapKeysToSnakeCase).mockReturnValue(transformedAttributes);

      meter.recordChannelLatency(latency, originalAttributes);

      expect(mockMeter.createHistogram).toHaveBeenCalledWith(
        "channel_latency_ms",
        {
          description: "Время выполнения channel.send() в миллисекундах",
        },
      );
      expect(mapKeysToSnakeCase).toHaveBeenCalledWith(originalAttributes);
      expect(mockHistogram.record).toHaveBeenCalledOnce();
      expect(mockHistogram.record).toHaveBeenCalledWith(
        latency,
        transformedAttributes,
      );
    });

    it("should handle different latency values and attribute types", () => {
      const meter = createMeter(mockConfig);
      const testCases = [
        { latency: 0, attributes: { channelType: "sms", success: false } },
        { latency: 1000, attributes: { channelType: "push", success: true } },
        { latency: 42.5, attributes: { channelType: "email", success: true } },
      ];

      testCases.forEach(({ latency, attributes }) => {
        const transformedAttrs = {
          channel_type: attributes.channelType,
          success: attributes.success,
        };
        mockHistogram.record.mockClear();
        vi.mocked(mapKeysToSnakeCase).mockReturnValue(transformedAttrs);

        meter.recordChannelLatency(latency, attributes);
        expect(mapKeysToSnakeCase).toHaveBeenCalledWith(attributes);
        expect(mockHistogram.record).toHaveBeenCalledWith(
          latency,
          transformedAttrs,
        );
      });
    });
  });

  describe("incrementNotificationsByChannel", () => {
    it("should increment counter with correct transformed channel and result attributes for success", () => {
      const meter = createMeter(mockConfig);
      const channel = "email";
      const result = "success";
      const originalAttrs = { channel, result };
      const transformedAttrs = { channel, result };

      vi.mocked(mapKeysToSnakeCase).mockReturnValue(transformedAttrs);

      meter.incrementNotificationsByChannel(channel, result);

      expect(mockMeter.createCounter).toHaveBeenCalledWith(
        "notifications_by_channel_total",
        {
          description:
            "Общее количество уведомлений по каналу отправки и результату",
        },
      );
      expect(mapKeysToSnakeCase).toHaveBeenCalledWith(originalAttrs);
      expect(mockCounter.add).toHaveBeenCalledOnce();
      expect(mockCounter.add).toHaveBeenCalledWith(1, transformedAttrs);
    });

    it("should increment counter with correct transformed channel and result attributes for failure", () => {
      const meter = createMeter(mockConfig);
      const channel = "sms";
      const result = "failure";
      const originalAttrs = { channel, result };
      const transformedAttrs = { channel, result };

      vi.mocked(mapKeysToSnakeCase).mockReturnValue(transformedAttrs);

      meter.incrementNotificationsByChannel(channel, result);

      expect(mapKeysToSnakeCase).toHaveBeenCalledWith(originalAttrs);
      expect(mockCounter.add).toHaveBeenCalledWith(1, transformedAttrs);
    });

    it("should handle different channels and results", () => {
      const meter = createMeter(mockConfig);
      const testCases = [
        { channel: "email", result: "success" as const },
        { channel: "sms", result: "failure" as const },
        { channel: "push", result: "success" as const },
        { channel: "phone", result: "failure" as const },
      ];

      testCases.forEach(({ channel, result }) => {
        const originalAttrs = { channel, result };
        const transformedAttrs = { channel, result };
        mockCounter.add.mockClear();
        vi.mocked(mapKeysToSnakeCase).mockReturnValue(transformedAttrs);

        meter.incrementNotificationsByChannel(channel, result);
        expect(mapKeysToSnakeCase).toHaveBeenCalledWith(originalAttrs);
        expect(mockCounter.add).toHaveBeenCalledWith(1, transformedAttrs);
      });
    });
  });

  describe("incrementTotalNotifications", () => {
    it("should increment total notifications counter", () => {
      const meter = createMeter(mockConfig);

      meter.incrementTotalNotifications();

      expect(mockMeter.createCounter).toHaveBeenCalledWith(
        "notifications_total",
        {
          description: "Общее количество уведомлений, обработанных сервисом",
        },
      );
      expect(mockCounter.add).toHaveBeenCalledOnce();
      expect(mockCounter.add).toHaveBeenCalledWith(1);
    });

    it("should handle multiple increments", () => {
      const meter = createMeter(mockConfig);

      meter.incrementTotalNotifications();
      meter.incrementTotalNotifications();
      meter.incrementTotalNotifications();

      expect(mockCounter.add).toHaveBeenCalledTimes(3);
      expect(mockCounter.add).toHaveBeenNthCalledWith(1, 1);
      expect(mockCounter.add).toHaveBeenNthCalledWith(2, 1);
      expect(mockCounter.add).toHaveBeenNthCalledWith(3, 1);
    });
  });

  describe("incrementNotificationsProcessedByResult", () => {
    it("should increment counter with correct transformed result attribute for success", () => {
      const meter = createMeter(mockConfig);
      const result = "success";
      const originalAttrs = { result };
      const transformedAttrs = { result };

      vi.mocked(mapKeysToSnakeCase).mockReturnValue(transformedAttrs);

      meter.incrementNotificationsProcessedByResult(result);

      expect(mockMeter.createCounter).toHaveBeenCalledWith(
        "notifications_processed_by_result_total",
        {
          description:
            "Общее количество уведомлений, обработанных сервисом, по результату",
        },
      );
      expect(mapKeysToSnakeCase).toHaveBeenCalledWith(originalAttrs);
      expect(mockCounter.add).toHaveBeenCalledOnce();
      expect(mockCounter.add).toHaveBeenCalledWith(1, transformedAttrs);
    });

    it("should increment counter with correct transformed result attribute for failure", () => {
      const meter = createMeter(mockConfig);
      const result = "failure";
      const originalAttrs = { result };
      const transformedAttrs = { result };

      vi.mocked(mapKeysToSnakeCase).mockReturnValue(transformedAttrs);

      meter.incrementNotificationsProcessedByResult(result);

      expect(mapKeysToSnakeCase).toHaveBeenCalledWith(originalAttrs);
      expect(mockCounter.add).toHaveBeenCalledWith(1, transformedAttrs);
    });

    it("should handle different results", () => {
      const meter = createMeter(mockConfig);
      const results = ["success", "failure"] as const;

      results.forEach((result) => {
        const originalAttrs = { result };
        const transformedAttrs = { result };
        mockCounter.add.mockClear();
        vi.mocked(mapKeysToSnakeCase).mockReturnValue(transformedAttrs);

        meter.incrementNotificationsProcessedByResult(result);
        expect(mapKeysToSnakeCase).toHaveBeenCalledWith(originalAttrs);
        expect(mockCounter.add).toHaveBeenCalledWith(1, transformedAttrs);
      });
    });
  });

  describe("incrementNotificationsProcessedBySubject", () => {
    it("should increment counter with correct transformed subjectId attribute", () => {
      const meter = createMeter(mockConfig);
      const subjectId = "user-123";
      const originalAttrs = { subjectId };
      const transformedAttrs = { subject_id: subjectId };

      vi.mocked(mapKeysToSnakeCase).mockReturnValue(transformedAttrs);

      meter.incrementNotificationsProcessedBySubject(subjectId);

      expect(mockMeter.createCounter).toHaveBeenCalledWith(
        "notifications_processed_by_subject_total",
        {
          description:
            "Общее количество обработанных уведомлений по subject.id",
        },
      );
      expect(mapKeysToSnakeCase).toHaveBeenCalledWith(originalAttrs);
      expect(mockCounter.add).toHaveBeenCalledOnce();
      expect(mockCounter.add).toHaveBeenCalledWith(1, transformedAttrs);
    });

    it("should handle different subject IDs", () => {
      const meter = createMeter(mockConfig);
      const subjectIds = ["user-123", "user-456", "admin-789"];

      subjectIds.forEach((subjectId) => {
        const originalAttrs = { subjectId };
        const transformedAttrs = { subject_id: subjectId };
        mockCounter.add.mockClear();
        vi.mocked(mapKeysToSnakeCase).mockReturnValue(transformedAttrs);

        meter.incrementNotificationsProcessedBySubject(subjectId);
        expect(mapKeysToSnakeCase).toHaveBeenCalledWith(originalAttrs);
        expect(mockCounter.add).toHaveBeenCalledWith(1, transformedAttrs);
      });
    });
  });

  describe("incrementNotificationsProcessedByStrategy", () => {
    it("should increment counter with correct transformed strategy attribute", () => {
      const meter = createMeter(mockConfig);
      const strategy = "email";
      const originalAttrs = { strategy };
      const transformedAttrs = { strategy };

      vi.mocked(mapKeysToSnakeCase).mockReturnValue(transformedAttrs);

      meter.incrementNotificationsProcessedByStrategy(strategy);

      expect(mockMeter.createCounter).toHaveBeenCalledWith(
        "notifications_processed_by_strategy_total",
        {
          description: "Общее количество обработанных уведомлений по стратегии",
        },
      );
      expect(mapKeysToSnakeCase).toHaveBeenCalledWith(originalAttrs);
      expect(mockCounter.add).toHaveBeenCalledOnce();
      expect(mockCounter.add).toHaveBeenCalledWith(1, transformedAttrs);
    });

    it("should handle different strategy names", () => {
      const meter = createMeter(mockConfig);
      const strategies = ["email", "sms", "push", "webhook"];

      strategies.forEach((strategy) => {
        const originalAttrs = { strategy };
        const transformedAttrs = { strategy };
        mockCounter.add.mockClear();
        vi.mocked(mapKeysToSnakeCase).mockReturnValue(transformedAttrs);

        meter.incrementNotificationsProcessedByStrategy(strategy);
        expect(mapKeysToSnakeCase).toHaveBeenCalledWith(originalAttrs);
        expect(mockCounter.add).toHaveBeenCalledWith(1, transformedAttrs);
      });
    });
  });

  describe("incrementNotificationsByPriority", () => {
    it("should increment counter with transformed isImmediate true for immediate notifications", () => {
      const meter = createMeter(mockConfig);
      const isImmediate = true;
      const originalAttrs = { isImmediate };
      const transformedAttrs = { is_immediate: true };

      vi.mocked(mapKeysToSnakeCase).mockReturnValue(transformedAttrs);

      meter.incrementNotificationsByPriority(isImmediate);

      expect(mockMeter.createCounter).toHaveBeenCalledWith(
        "notifications_processed_by_priority_total",
        {
          description:
            "Общее количество обработанных уведомлений по признаку срочности (isImmediate)",
        },
      );
      expect(mapKeysToSnakeCase).toHaveBeenCalledWith(originalAttrs);
      expect(mockCounter.add).toHaveBeenCalledOnce();
      expect(mockCounter.add).toHaveBeenCalledWith(1, transformedAttrs);
    });

    it("should increment counter with transformed isImmediate false for non-immediate notifications", () => {
      const meter = createMeter(mockConfig);
      const isImmediate = false;
      const originalAttrs = { isImmediate };
      const transformedAttrs = { is_immediate: false };

      vi.mocked(mapKeysToSnakeCase).mockReturnValue(transformedAttrs);

      meter.incrementNotificationsByPriority(isImmediate);

      expect(mapKeysToSnakeCase).toHaveBeenCalledWith(originalAttrs);
      expect(mockCounter.add).toHaveBeenCalledWith(1, transformedAttrs);
    });

    it("should handle both priority types", () => {
      const meter = createMeter(mockConfig);

      const originalAttrsTrue = { isImmediate: true };
      const transformedAttrsTrue = { is_immediate: true };
      vi.mocked(mapKeysToSnakeCase).mockReturnValue(transformedAttrsTrue);

      meter.incrementNotificationsByPriority(true);
      expect(mapKeysToSnakeCase).toHaveBeenCalledWith(originalAttrsTrue);
      expect(mockCounter.add).toHaveBeenCalledWith(1, transformedAttrsTrue);

      mockCounter.add.mockClear();
      vi.mocked(mapKeysToSnakeCase).mockReturnValue({ is_immediate: false });

      const originalAttrsFalse = { isImmediate: false };
      const transformedAttrsFalse = { is_immediate: false };

      meter.incrementNotificationsByPriority(false);
      expect(mapKeysToSnakeCase).toHaveBeenCalledWith(originalAttrsFalse);
      expect(mockCounter.add).toHaveBeenCalledWith(1, transformedAttrsFalse);
    });
  });

  it("should create all metrics instruments only once", () => {
    createMeter(mockConfig);

    expect(mockMeter.createHistogram).toHaveBeenCalledOnce();
    expect(mockMeter.createCounter).toHaveBeenCalledTimes(6);
  });

  it("should return all meter functions", () => {
    const meter = createMeter(mockConfig);

    expect(meter).toHaveProperty("recordChannelLatency");
    expect(meter).toHaveProperty("incrementNotificationsByChannel");

    expect(meter).toHaveProperty("incrementTotalNotifications");
    expect(meter).toHaveProperty("incrementNotificationsProcessedByResult");
    expect(meter).toHaveProperty("incrementNotificationsProcessedBySubject");
    expect(meter).toHaveProperty("incrementNotificationsProcessedByStrategy");
    expect(meter).toHaveProperty("incrementNotificationsByPriority");

    expect(typeof meter.recordChannelLatency).toBe("function");
    expect(typeof meter.incrementNotificationsByChannel).toBe("function");
    expect(typeof meter.incrementTotalNotifications).toBe("function");
    expect(typeof meter.incrementNotificationsProcessedByResult).toBe(
      "function",
    );
    expect(typeof meter.incrementNotificationsProcessedBySubject).toBe(
      "function",
    );
    expect(typeof meter.incrementNotificationsProcessedByStrategy).toBe(
      "function",
    );
    expect(typeof meter.incrementNotificationsByPriority).toBe("function");
  });
});
