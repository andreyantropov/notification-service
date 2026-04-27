import { beforeEach, describe, expect, it, vi } from "vitest";

import { type IncomingNotification } from "../../../../application/types/index.js";
import { type ReceiveNotificationUseCase } from "../../../../application/useCases/index.js";
import {
  type Initiator,
  type Notification,
} from "../../../../domain/types/index.js";
import { type Meter } from "../../../telemetry/index.js";

import { type MetricsDependencies } from "./interfaces/index.js";
import { withMetrics } from "./withMetrics.js";

describe("withMetrics (ReceiveNotificationUseCase)", () => {
  let mockUseCase: ReceiveNotificationUseCase;
  let mockMeter: Meter;

  const mockInitiator: Initiator = { id: "user-123", name: "Tester" };
  const mockIncoming: IncomingNotification = { contacts: [], message: "test" };
  const mockNotification: Notification = {
    id: "notif-1",
    strategy: "send_to_first_available",
    createdAt: new Date().toISOString(),
    contacts: [],
    message: "test",
    initiator: mockInitiator,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-01-01T00:00:00Z"));

    mockUseCase = {
      execute: vi.fn(),
    };

    mockMeter = {
      increment: vi.fn(),
      add: vi.fn(),
      record: vi.fn(),
      gauge: vi.fn(),
    };
  });

  const getDeps = (): MetricsDependencies => ({
    receiveNotificationUseCase: mockUseCase,
    meter: mockMeter,
  });

  describe("execute", () => {
    it("should record success metrics for single notification", async () => {
      vi.mocked(mockUseCase.execute).mockResolvedValue(mockNotification);
      const decorated = withMetrics(getDeps());

      const promise = decorated.execute(mockIncoming, mockInitiator);
      vi.advanceTimersByTime(100);
      await promise;

      expect(mockMeter.increment).toHaveBeenCalledWith(
        "notifications_received_total",
        {
          mode: "single",
          status: "success",
          initiator: mockInitiator.id,
        },
      );
      expect(mockMeter.record).toHaveBeenCalledWith(
        "notifications_received_duration_ms",
        100,
        {
          mode: "single",
          status: "success",
          initiator: mockInitiator.id,
        },
      );
    });

    it("should record error metrics on failure", async () => {
      vi.mocked(mockUseCase.execute).mockRejectedValue(new Error("Fail"));
      const decorated = withMetrics(getDeps());

      const promise = decorated.execute(mockIncoming, mockInitiator);
      vi.advanceTimersByTime(50);

      await expect(promise).rejects.toThrow("Fail");
      expect(mockMeter.increment).toHaveBeenCalledWith(
        "notifications_received_total",
        {
          mode: "single",
          status: "error",
          initiator: mockInitiator.id,
        },
      );
    });
  });
});
