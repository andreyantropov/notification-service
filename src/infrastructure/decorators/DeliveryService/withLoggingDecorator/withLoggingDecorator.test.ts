import { beforeEach, describe, expect, it, vi } from "vitest";

import { type DeliveryService } from "../../../../application/services/index.js";
import { type Notification } from "../../../../domain/types/index.js";
import {
  EVENT_TYPE,
  type Logger,
  TRIGGER_TYPE,
} from "../../../telemetry/index.js";

import { type LoggingDecoratorDependencies } from "./interfaces/index.js";
import { withLoggingDecorator } from "./withLoggingDecorator.js";

describe("withLoggingDecorator (DeliveryService)", () => {
  let mockDeliveryService: DeliveryService;
  let mockLogger: Logger;

  const mockNotification: Notification = {
    id: "notif-123",
    message: "test",
    contacts: [],
    createdAt: new Date().toISOString(),
    initiator: { id: "1", name: "admin" },
    strategy: "send_to_all_available",
  } as unknown as Notification;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-01-01T00:00:00Z"));

    mockDeliveryService = {
      deliver: vi.fn().mockResolvedValue(undefined),
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
    deliveryService: mockDeliveryService,
    logger: mockLogger,
  });

  it("should log info with notification strategy and eventName when delivery succeeds", async () => {
    const decorated = withLoggingDecorator(getDeps());

    const promise = decorated.deliver(mockNotification);
    vi.advanceTimersByTime(150);
    await promise;

    expect(mockLogger.info).toHaveBeenCalledWith(
      expect.objectContaining({
        message: `Уведомление успешно доставлено стратегией ${mockNotification.strategy}`,
        eventName: "notification.deliver",
        durationMs: 150,
        eventType: EVENT_TYPE.MESSAGING,
        trigger: TRIGGER_TYPE.API,
        details: {
          id: mockNotification.id,
          strategy: mockNotification.strategy,
        },
      }),
    );
  });

  it("should log error and rethrow with eventName when delivery fails", async () => {
    const error = new Error("Provider down");
    vi.mocked(mockDeliveryService.deliver).mockRejectedValue(error);

    const decorated = withLoggingDecorator(getDeps());

    const promise = decorated.deliver(mockNotification);
    vi.advanceTimersByTime(50);

    await expect(promise).rejects.toThrow(error);

    expect(mockLogger.error).toHaveBeenCalledWith(
      expect.objectContaining({
        message: `Не удалось доставить уведомление стратегией ${mockNotification.strategy}`,
        eventName: "notification.deliver",
        durationMs: 50,
        error,
        details: {
          id: mockNotification.id,
          strategy: mockNotification.strategy,
        },
      }),
    );
  });

  it("should preserve other service methods", () => {
    const complexService = {
      ...mockDeliveryService,
      otherMethod: vi.fn(),
    } as unknown as DeliveryService;

    const decorated = withLoggingDecorator({
      deliveryService: complexService,
      logger: mockLogger,
    });

    expect(decorated).toHaveProperty("otherMethod");
  });
});
