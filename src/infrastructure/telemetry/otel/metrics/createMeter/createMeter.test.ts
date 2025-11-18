import { metrics } from "@opentelemetry/api";
import { describe, it, expect, vi, beforeEach, Mock } from "vitest";

import { createMeter } from "./createMeter.js";

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
    createHistogram: vi.fn(),
    createCounter: vi.fn(),
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

    expect(metrics.getMeter).toHaveBeenCalledOnce();
    expect(metrics.getMeter).toHaveBeenCalledWith(mockConfig.serviceName);
  });

  describe("recordChannelLatency", () => {
    it("should record latency with correct histogram and attributes", () => {
      const meter = createMeter(mockConfig);
      const latency = 150;
      const attributes = { channel: "email", success: true };

      meter.recordChannelLatency(latency, attributes);

      expect(mockMeter.createHistogram).toHaveBeenCalledWith(
        "channel_latency_ms",
        {
          description: "Время выполнения channel.send() в миллисекундах",
        },
      );
      expect(mockHistogram.record).toHaveBeenCalledOnce();
      expect(mockHistogram.record).toHaveBeenCalledWith(latency, attributes);
    });

    it("should handle different latency values and attribute types", () => {
      const meter = createMeter(mockConfig);
      const testCases = [
        { latency: 0, attributes: { channel: "sms", success: false } },
        { latency: 1000, attributes: { channel: "push", success: true } },
        { latency: 42.5, attributes: { channel: "email", success: true } },
      ];

      testCases.forEach(({ latency, attributes }) => {
        mockHistogram.record.mockClear();
        meter.recordChannelLatency(latency, attributes);
        expect(mockHistogram.record).toHaveBeenCalledWith(latency, attributes);
      });
    });
  });

  describe("incrementNotificationsByChannel", () => {
    it("should increment counter with correct channel and result attributes for success", () => {
      const meter = createMeter(mockConfig);
      const channel = "email";
      const result = "success";

      meter.incrementNotificationsByChannel(channel, result);

      expect(mockMeter.createCounter).toHaveBeenCalledWith(
        "notifications_by_channel_total",
        {
          description:
            "Общее количество уведомлений по каналу отправки и результату",
        },
      );
      expect(mockCounter.add).toHaveBeenCalledOnce();
      expect(mockCounter.add).toHaveBeenCalledWith(1, {
        channel,
        result: "success",
      });
    });

    it("should increment counter with correct channel and result attributes for failure", () => {
      const meter = createMeter(mockConfig);
      const channel = "sms";
      const result = "failure";

      meter.incrementNotificationsByChannel(channel, result);

      expect(mockCounter.add).toHaveBeenCalledWith(1, {
        channel,
        result: "failure",
      });
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
        mockCounter.add.mockClear();
        meter.incrementNotificationsByChannel(channel, result);
        expect(mockCounter.add).toHaveBeenCalledWith(1, {
          channel,
          result,
        });
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
    it("should increment counter with correct result attribute for success", () => {
      const meter = createMeter(mockConfig);
      const result = "success";

      meter.incrementNotificationsProcessedByResult(result);

      expect(mockMeter.createCounter).toHaveBeenCalledWith(
        "notifications_processed_by_result_total",
        {
          description:
            "Общее количество уведомлений, обработанных сервисом, по результату",
        },
      );
      expect(mockCounter.add).toHaveBeenCalledOnce();
      expect(mockCounter.add).toHaveBeenCalledWith(1, {
        result: "success",
      });
    });

    it("should increment counter with correct result attribute for failure", () => {
      const meter = createMeter(mockConfig);
      const result = "failure";

      meter.incrementNotificationsProcessedByResult(result);

      expect(mockCounter.add).toHaveBeenCalledWith(1, {
        result: "failure",
      });
    });

    it("should handle different results", () => {
      const meter = createMeter(mockConfig);
      const results = ["success", "failure"] as const;

      results.forEach((result) => {
        mockCounter.add.mockClear();
        meter.incrementNotificationsProcessedByResult(result);
        expect(mockCounter.add).toHaveBeenCalledWith(1, { result });
      });
    });
  });

  describe("incrementNotificationsProcessedBySubject", () => {
    it("should increment counter with correct subjectId attribute", () => {
      const meter = createMeter(mockConfig);
      const subjectId = "user-123";

      meter.incrementNotificationsProcessedBySubject(subjectId);

      expect(mockMeter.createCounter).toHaveBeenCalledWith(
        "notifications_processed_by_subject_total",
        {
          description:
            "Общее количество обработанных уведомлений по subject.id",
        },
      );
      expect(mockCounter.add).toHaveBeenCalledOnce();
      expect(mockCounter.add).toHaveBeenCalledWith(1, {
        subjectId,
      });
    });

    it("should handle different subject IDs", () => {
      const meter = createMeter(mockConfig);
      const subjectIds = ["user-123", "user-456", "admin-789"];

      subjectIds.forEach((subjectId) => {
        mockCounter.add.mockClear();
        meter.incrementNotificationsProcessedBySubject(subjectId);
        expect(mockCounter.add).toHaveBeenCalledWith(1, {
          subjectId,
        });
      });
    });
  });

  describe("incrementNotificationsProcessedByStrategy", () => {
    it("should increment counter with correct strategy attribute", () => {
      const meter = createMeter(mockConfig);
      const strategy = "email";

      meter.incrementNotificationsProcessedByStrategy(strategy);

      expect(mockMeter.createCounter).toHaveBeenCalledWith(
        "notifications_processed_by_strategy_total",
        {
          description: "Общее количество обработанных уведомлений по стратегии",
        },
      );
      expect(mockCounter.add).toHaveBeenCalledOnce();
      expect(mockCounter.add).toHaveBeenCalledWith(1, { strategy });
    });

    it("should handle different strategy names", () => {
      const meter = createMeter(mockConfig);
      const strategies = ["email", "sms", "push", "webhook"];

      strategies.forEach((strategy) => {
        mockCounter.add.mockClear();
        meter.incrementNotificationsProcessedByStrategy(strategy);
        expect(mockCounter.add).toHaveBeenCalledWith(1, { strategy });
      });
    });
  });

  describe("incrementNotificationsByPriority", () => {
    it("should increment counter with isImmediate true for immediate notifications", () => {
      const meter = createMeter(mockConfig);
      const isImmediate = true;

      meter.incrementNotificationsByPriority(isImmediate);

      expect(mockMeter.createCounter).toHaveBeenCalledWith(
        "notifications_processed_by_priority_total",
        {
          description:
            "Общее количество обработанных уведомлений по признаку срочности (isImmediate)",
        },
      );
      expect(mockCounter.add).toHaveBeenCalledOnce();
      expect(mockCounter.add).toHaveBeenCalledWith(1, { isImmediate: true });
    });

    it("should increment counter with isImmediate false for non-immediate notifications", () => {
      const meter = createMeter(mockConfig);
      const isImmediate = false;

      meter.incrementNotificationsByPriority(isImmediate);

      expect(mockCounter.add).toHaveBeenCalledWith(1, { isImmediate: false });
    });

    it("should handle both priority types", () => {
      const meter = createMeter(mockConfig);

      meter.incrementNotificationsByPriority(true);
      expect(mockCounter.add).toHaveBeenCalledWith(1, { isImmediate: true });

      mockCounter.add.mockClear();

      meter.incrementNotificationsByPriority(false);
      expect(mockCounter.add).toHaveBeenCalledWith(1, { isImmediate: false });
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
