import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  type IncomingNotification,
  type NotificationResult,
  NOTIFY_STATUS,
} from "../../../../application/types/index.js";
import { type ReceiveNotificationBatchUseCase } from "../../../../application/useCases/index.js";
import {
  type Initiator,
  type Notification,
} from "../../../../domain/types/index.js";
import { type Meter } from "../../../telemetry/index.js";

import { type MetricsDecoratorDependencies } from "./interfaces/index.js";
import { withMetricsDecorator } from "./withMetricsDecorator.js";

describe("withMetricsDecorator (ReceiveNotificationBatchUseCase)", () => {
  let mockUseCase: ReceiveNotificationBatchUseCase;
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
      add: vi.fn(),
      record: vi.fn(),
    } as unknown as Meter;
  });

  const getDeps = (): MetricsDecoratorDependencies => ({
    receiveNotificationBatchUseCase: mockUseCase,
    meter: mockMeter,
  });

  describe("execute", () => {
    it("should record success metrics when all notifications are successful", async () => {
      const results: NotificationResult[] = [
        { status: NOTIFY_STATUS.SUCCESS, payload: mockNotification },
        { status: NOTIFY_STATUS.SUCCESS, payload: mockNotification },
      ];

      vi.mocked(mockUseCase.execute).mockImplementation(async () => {
        vi.advanceTimersByTime(300);
        return results;
      });

      const decorated = withMetricsDecorator(getDeps());
      await decorated.execute([mockIncoming, mockIncoming], mockInitiator);

      expect(mockMeter.add).toHaveBeenCalledTimes(1);
      expect(mockMeter.add).toHaveBeenCalledWith(
        "notifications_received_total",
        2,
        { mode: "batch", status: "success", initiator: mockInitiator.id },
      );

      expect(mockMeter.record).toHaveBeenCalledWith(
        "notifications_received_duration_ms",
        300,
        { mode: "batch", status: "success", initiator: mockInitiator.id },
      );
    });

    it("should record separate success and error metrics when batch is error", async () => {
      const results: NotificationResult[] = [
        { status: NOTIFY_STATUS.SUCCESS, payload: mockNotification },
        { status: NOTIFY_STATUS.SERVER_ERROR, error: { message: "Fail" } },
      ];

      vi.mocked(mockUseCase.execute).mockResolvedValue(results);
      const decorated = withMetricsDecorator(getDeps());

      await decorated.execute([mockIncoming, mockIncoming], mockInitiator);

      expect(mockMeter.add).toHaveBeenCalledTimes(2);

      expect(mockMeter.add).toHaveBeenCalledWith(
        "notifications_received_total",
        1,
        { mode: "batch", status: "success", initiator: mockInitiator.id },
      );

      expect(mockMeter.add).toHaveBeenCalledWith(
        "notifications_received_total",
        1,
        { mode: "batch", status: "error", initiator: mockInitiator.id },
      );

      expect(mockMeter.record).toHaveBeenCalledWith(
        "notifications_received_duration_ms",
        expect.any(Number),
        { mode: "batch", status: "error", initiator: mockInitiator.id },
      );
    });

    it("should record only error metrics when all notifications in batch failed", async () => {
      const results: NotificationResult[] = [
        { status: NOTIFY_STATUS.SERVER_ERROR, error: { message: "Fail 1" } },
        { status: NOTIFY_STATUS.CLIENT_ERROR, error: { message: "Fail 2" } },
      ];

      vi.mocked(mockUseCase.execute).mockResolvedValue(results);
      const decorated = withMetricsDecorator(getDeps());

      await decorated.execute([mockIncoming, mockIncoming], mockInitiator);

      expect(mockMeter.add).toHaveBeenCalledTimes(1);
      expect(mockMeter.add).toHaveBeenCalledWith(
        "notifications_received_total",
        2,
        { mode: "batch", status: "error", initiator: mockInitiator.id },
      );

      expect(mockMeter.record).toHaveBeenCalledWith(
        "notifications_received_duration_ms",
        expect.any(Number),
        { mode: "batch", status: "error", initiator: mockInitiator.id },
      );
    });
  });
});
