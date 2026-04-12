import { beforeEach, describe, expect, it, vi } from "vitest";

import { type IncomingNotification } from "../../../../application/types/index.js";
import { type ReceiveNotificationUseCase } from "../../../../application/useCases/index.js";
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

describe("withLoggingDecorator (ReceiveNotificationUseCase)", () => {
  let mockUseCase: ReceiveNotificationUseCase;
  let mockLogger: Logger;

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
    receiveNotificationUseCase: mockUseCase,
    logger: mockLogger,
  });

  describe("execute", () => {
    it("should log info on successful single notification with eventName", async () => {
      vi.mocked(mockUseCase.execute).mockResolvedValue(mockNotification);
      const decorated = withLoggingDecorator(getDeps());

      const promise = decorated.execute(mockIncoming, mockInitiator);
      vi.advanceTimersByTime(100);
      const result = await promise;

      expect(result).toEqual(mockNotification);
      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Уведомление успешно отправлено",
          eventName: "notification.receive",
          durationMs: 100,
          eventType: EVENT_TYPE.MESSAGING,
          trigger: TRIGGER_TYPE.API,
          details: { id: mockNotification.id, initiator: mockInitiator.id },
        }),
      );
    });

    it("should log error and rethrow on failure with eventName", async () => {
      const error = new Error("Execution error");
      vi.mocked(mockUseCase.execute).mockRejectedValue(error);
      const decorated = withLoggingDecorator(getDeps());

      const promise = decorated.execute(mockIncoming, mockInitiator);
      vi.advanceTimersByTime(50);

      await expect(promise).rejects.toThrow(error);
      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Не удалось отправить уведомление",
          eventName: "notification.receive",
          durationMs: 50,
          error,
        }),
      );
    });
  });
});
