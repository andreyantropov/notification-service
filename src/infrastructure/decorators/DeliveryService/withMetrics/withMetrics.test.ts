import { beforeEach, describe, expect, it, vi } from "vitest";

import { type DeliveryService } from "../../../../application/services/index.js";
import { type Notification } from "../../../../domain/types/index.js";
import { type Meter } from "../../../telemetry/index.js";

import { type MetricsDependencies } from "./interfaces/index.js";
import { withMetrics } from "./withMetrics.js";

describe("withMetrics (DeliveryService)", () => {
  let mockDeliveryService: DeliveryService;
  let mockMeter: Meter;

  const mockNotification: Notification = {
    id: "notif-1",
    message: "test",
    contacts: [],
    createdAt: new Date().toISOString(),
    initiator: { id: "1", name: "admin" },
    strategy: "custom_strategy",
  } as unknown as Notification;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-01-01T00:00:00Z"));

    mockDeliveryService = {
      deliver: vi.fn().mockResolvedValue(undefined),
    };

    mockMeter = {
      add: vi.fn(),
      gauge: vi.fn(),
      increment: vi.fn(),
      record: vi.fn(),
    };
  });

  const getDeps = (): MetricsDependencies => ({
    deliveryService: mockDeliveryService,
    meter: mockMeter,
  });

  it("should record success metrics with strategy from notification", async () => {
    const decorated = withMetrics(getDeps());

    const promise = decorated.deliver(mockNotification);
    vi.advanceTimersByTime(200);
    await promise;

    expect(mockMeter.increment).toHaveBeenCalledWith(
      "notifications_delivered_total",
      {
        status: "success",
        strategy: "custom_strategy",
      },
    );

    expect(mockMeter.record).toHaveBeenCalledWith(
      "notifications_delivered_duration_ms",
      200,
      { status: "success", strategy: "custom_strategy" },
    );
  });

  it("should record error metrics and rethrow when delivery fails", async () => {
    const error = new Error("Delivery Error");
    vi.mocked(mockDeliveryService.deliver).mockRejectedValue(error);

    const decorated = withMetrics(getDeps());

    const promise = decorated.deliver(mockNotification);
    vi.advanceTimersByTime(50);

    await expect(promise).rejects.toThrow(error);

    expect(mockMeter.increment).toHaveBeenCalledWith(
      "notifications_delivered_total",
      {
        status: "error",
        strategy: "custom_strategy",
      },
    );

    expect(mockMeter.record).toHaveBeenCalledWith(
      "notifications_delivered_duration_ms",
      50,
      { status: "error", strategy: "custom_strategy" },
    );
  });

  it("should preserve original service properties", () => {
    const complexService = {
      ...mockDeliveryService,
      otherMethod: vi.fn(),
    } as unknown as DeliveryService;

    const decorated = withMetrics({
      deliveryService: complexService,
      meter: mockMeter,
    });

    expect(decorated).toHaveProperty("otherMethod");
  });
});
