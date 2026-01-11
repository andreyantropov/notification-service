import { describe, it, expect, vi } from "vitest";

import { createMeteredRetryService } from "./createMeteredRetryService.js";
import type { Meter } from "../../../../ports/index.js";
import type { RetryService } from "../../interfaces/RetryService.js";
import { NOTIFICATIONS_RETRY_ROUTING_TOTAL } from "./constants/index.js";

const createMockRetryService = (returnValue: string): RetryService => ({
  getRetryQueue: vi.fn().mockReturnValue(returnValue),
});

const createMockMeter = (): Meter => ({
  increment: vi.fn(),
  record: vi.fn(),
});

describe("createMeteredRetryService", () => {
  it("should return the same queue as the underlying retry service", () => {
    const expectedQueue = "notifications.retry.30m";
    const retryService = createMockRetryService(expectedQueue);
    const meter = createMockMeter();

    const meteredRetryService = createMeteredRetryService({
      retryService,
      meter,
    });

    const result = meteredRetryService.getRetryQueue(1);

    expect(result).toBe(expectedQueue);
  });

  it("should call the underlying retry service with the provided retryCount", () => {
    const retryService = createMockRetryService("notifications.dlq");
    const meter = createMockMeter();

    const meteredRetryService = createMeteredRetryService({
      retryService,
      meter,
    });

    const testRetryCount = 5;
    meteredRetryService.getRetryQueue(testRetryCount);

    expect(retryService.getRetryQueue).toHaveBeenCalledWith(testRetryCount);
  });

  it("should increment retry routing metric with the correct queue name", () => {
    const queue = "notifications.retry.2h";
    const retryService = createMockRetryService(queue);
    const meter = createMockMeter();

    const meteredRetryService = createMeteredRetryService({
      retryService,
      meter,
    });

    meteredRetryService.getRetryQueue(2);

    expect(meter.increment).toHaveBeenCalledTimes(1);
    expect(meter.increment).toHaveBeenCalledWith(NOTIFICATIONS_RETRY_ROUTING_TOTAL, {
      retryQueue: queue,
    });
  });

  it("should handle DLQ routing correctly", () => {
    const dlq = "notifications.dlq";
    const retryService = createMockRetryService(dlq);
    const meter = createMockMeter();

    const meteredRetryService = createMeteredRetryService({
      retryService,
      meter,
    });

    meteredRetryService.getRetryQueue(999);

    expect(meter.increment).toHaveBeenCalledWith(NOTIFICATIONS_RETRY_ROUTING_TOTAL, {
      retryQueue: dlq,
    });
  });

  it("should not interfere with the retry service logic", () => {
    const retryService: RetryService = {
      getRetryQueue: vi.fn((count) => {
        if (count === 1) return "notifications.retry.30m";
        if (count === 2) return "notifications.retry.2h";
        return "notifications.dlq";
      }),
    };
    const meter = createMockMeter();

    const meteredRetryService = createMeteredRetryService({
      retryService,
      meter,
    });

    expect(meteredRetryService.getRetryQueue(1)).toBe("notifications.retry.30m");
    expect(meteredRetryService.getRetryQueue(2)).toBe("notifications.retry.2h");
    expect(meteredRetryService.getRetryQueue(3)).toBe("notifications.dlq");

    expect(retryService.getRetryQueue).toHaveBeenCalledTimes(3);
    expect(meter.increment).toHaveBeenCalledTimes(3);
    expect(meter.increment).toHaveBeenNthCalledWith(
      1,
      NOTIFICATIONS_RETRY_ROUTING_TOTAL,
      { retryQueue: "notifications.retry.30m" },
    );
    expect(meter.increment).toHaveBeenNthCalledWith(
      2,
      NOTIFICATIONS_RETRY_ROUTING_TOTAL,
      { retryQueue: "notifications.retry.2h" },
    );
    expect(meter.increment).toHaveBeenNthCalledWith(
      3,
      NOTIFICATIONS_RETRY_ROUTING_TOTAL,
      { retryQueue: "notifications.dlq" },
    );
  });
});