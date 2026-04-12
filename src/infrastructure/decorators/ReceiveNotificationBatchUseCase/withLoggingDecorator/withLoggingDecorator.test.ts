import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  type NotificationResult,
  NOTIFY_STATUS,
} from "../../../../application/types/index.js";
import { type ReceiveNotificationBatchUseCase } from "../../../../application/useCases/index.js";
import {
  type Initiator,
  type Notification,
} from "../../../../domain/types/index.js";
import {
  EVENT_TYPE,
  type Logger,
  TRIGGER_TYPE,
} from "../../../telemetry/index.js";

import { type LoggingDecoratorDependencies } from "./interfaces/index.js";
import { withLoggingDecorator } from "./withLoggingDecorator.js";

describe("withLoggingDecorator (ReceiveNotificationBatchUseCase)", () => {
  let mockUseCase: ReceiveNotificationBatchUseCase;
  let mockLogger: Logger;

  const mockInitiator: Initiator = { id: "user-123", name: "Tester" };
  const mockIncoming = { contacts: [], message: "test" };
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

    mockLogger = {
      trace: vi.fn().mockResolvedValue(undefined),
      debug: vi.fn().mockResolvedValue(undefined),
      info: vi.fn().mockResolvedValue(undefined),
      warn: vi.fn().mockResolvedValue(undefined),
      error: vi.fn().mockResolvedValue(undefined),
      fatal: vi.fn().mockResolvedValue(undefined),
    };
  });

  const getDeps = (): LoggingDecoratorDependencies => ({
    receiveNotificationBatchUseCase: mockUseCase,
    logger: mockLogger,
  });

  describe("execute", () => {
    it("should log info when all notifications in batch are successful", async () => {
      const results: NotificationResult[] = [
        { status: NOTIFY_STATUS.SUCCESS, payload: mockNotification },
        {
          status: NOTIFY_STATUS.SUCCESS,
          payload: { ...mockNotification, id: "notif-2" },
        },
      ];
      vi.mocked(mockUseCase.execute).mockResolvedValue(results);
      const decorated = withLoggingDecorator(getDeps());

      const promise = decorated.execute(
        [mockIncoming, mockIncoming],
        mockInitiator,
      );
      vi.advanceTimersByTime(200);
      await promise;

      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Все уведомления успешно отправлены",
          eventName: "notification.receive_batch",
          eventType: EVENT_TYPE.MESSAGING,
          trigger: TRIGGER_TYPE.API,
          durationMs: 200,
          details: expect.objectContaining({
            total: 2,
            accepted: 2,
            acceptedIds: ["notif-1", "notif-2"],
            initiator: mockInitiator.id,
          }),
        }),
      );
    });

    it("should log error when some notifications in batch failed", async () => {
      const results: NotificationResult[] = [
        { status: NOTIFY_STATUS.SUCCESS, payload: mockNotification },
        {
          status: NOTIFY_STATUS.SERVER_ERROR,
          error: { message: "Fail" },
        },
      ];
      vi.mocked(mockUseCase.execute).mockResolvedValue(results);
      const decorated = withLoggingDecorator(getDeps());

      await decorated.execute([mockIncoming, mockIncoming], mockInitiator);

      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Не удалось отправить некоторые уведомления",
          eventName: "notification.receive_batch",
          eventType: EVENT_TYPE.MESSAGING,
          trigger: TRIGGER_TYPE.API,
          details: expect.objectContaining({
            total: 2,
            accepted: 1,
            rejected: 1,
            acceptedIds: ["notif-1"],
            initiator: mockInitiator.id,
          }),
        }),
      );
    });
  });
});
