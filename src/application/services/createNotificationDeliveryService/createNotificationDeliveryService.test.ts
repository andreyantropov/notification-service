import { describe, it, expect, vi, beforeEach } from "vitest";

import { createNotificationDeliveryService } from "./createNotificationDeliveryService.js";
import { SendResult } from "./interfaces/SendResult.js";
import {
  strategyRegistry,
  DEFAULT_STRATEGY_KEY,
} from "./strategies/strategyRegistry.js";
import { Sender } from "../../../domain/ports/Sender.js";
import { Notification } from "../../../domain/types/Notification.js";

const emailRecipient = { type: "email", value: "test@example.com" } as const;
const message = "Test message";
const notification: Notification = {
  recipients: [emailRecipient],
  message,
  id: "",
};

const createMockSender = (
  isSupports: (recipient: unknown) => boolean,
  sendImpl: () => Promise<void>,
  checkHealthImpl?: () => Promise<void>,
): Sender => {
  return {
    type: "bitrix",
    isSupports,
    send: vi.fn(sendImpl),
    checkHealth: checkHealthImpl ? vi.fn(checkHealthImpl) : undefined,
  };
};

describe("createNotificationDeliveryService", () => {
  beforeEach(() => {
    // Очищаем моки стратегий перед каждым тестом
    vi.restoreAllMocks();
  });

  it("should throw if no senders are provided", () => {
    expect(() =>
      createNotificationDeliveryService({
        senders: [],
      }),
    ).toThrow("В сервис не передано ни одного сендера");
  });

  it("should use default strategy if not provided", async () => {
    const sender = createMockSender(
      () => true,
      async () => {},
    );
    const mockDefaultStrategy = vi.fn().mockResolvedValue({
      success: true,
      notification,
    });

    // Мокаем стратегию по умолчанию
    strategyRegistry[DEFAULT_STRATEGY_KEY] = mockDefaultStrategy;

    const service = createNotificationDeliveryService({
      senders: [sender],
    });

    await service.send([notification]);

    expect(mockDefaultStrategy).toHaveBeenCalledWith(notification, [sender]);
  });

  it("should return success result when strategy succeeds", async () => {
    const sender = createMockSender(
      () => true,
      async () => {},
    );

    const mockStrategy = vi.fn().mockResolvedValue({
      success: true,
      notification,
    });
    strategyRegistry[DEFAULT_STRATEGY_KEY] = mockStrategy;

    const service = createNotificationDeliveryService({
      senders: [sender],
    });

    const result = await service.send([notification]);

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      success: true,
      notification,
    });
    expect(mockStrategy).toHaveBeenCalledWith(notification, [sender]);
  });

  it("should return error result when strategy fails", async () => {
    const sender = createMockSender(
      () => true,
      async () => {},
    );

    const strategyError = new Error("Delivery failed");
    const mockStrategy = vi.fn().mockRejectedValue(strategyError);
    strategyRegistry[DEFAULT_STRATEGY_KEY] = mockStrategy;

    const service = createNotificationDeliveryService({
      senders: [sender],
    });

    const result = await service.send([notification]);

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual<SendResult>({
      success: false,
      notification,
      error: strategyError,
    });
    expect(mockStrategy).toHaveBeenCalledWith(notification, [sender]);
  });

  it("should handle array of notifications", async () => {
    const sender = createMockSender(
      () => true,
      async () => {},
    );

    const notification1 = { ...notification, message: "Msg 1" };
    const notification2 = { ...notification, message: "Msg 2" };

    const failError = new Error("Failed");
    const mockStrategy = vi
      .fn()
      .mockResolvedValueOnce({ success: true, notification: notification1 })
      .mockRejectedValueOnce(failError);
    strategyRegistry[DEFAULT_STRATEGY_KEY] = mockStrategy;

    const service = createNotificationDeliveryService({
      senders: [sender],
    });

    const result = await service.send([notification1, notification2]);

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual<SendResult>({
      success: true,
      notification: notification1,
    });
    expect(result[1]).toEqual<SendResult>({
      success: false,
      notification: notification2,
      error: failError,
    });

    expect(mockStrategy).toHaveBeenNthCalledWith(1, notification1, [sender]);
    expect(mockStrategy).toHaveBeenNthCalledWith(2, notification2, [sender]);
  });

  it("should handle single notification (object)", async () => {
    const sender = createMockSender(
      () => true,
      async () => {},
    );

    const mockStrategy = vi
      .fn()
      .mockResolvedValue({ success: true, notification });
    strategyRegistry[DEFAULT_STRATEGY_KEY] = mockStrategy;

    const service = createNotificationDeliveryService({
      senders: [sender],
    });

    const result = await service.send([notification]);

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual<SendResult>({
      success: true,
      notification,
    });
  });

  it("should return empty result array when empty input array is provided", async () => {
    const sender = createMockSender(
      () => true,
      async () => {},
    );

    const mockStrategy = vi.fn();
    strategyRegistry[DEFAULT_STRATEGY_KEY] = mockStrategy;

    const service = createNotificationDeliveryService({
      senders: [sender],
    });

    const result = await service.send([]);

    expect(result).toEqual([]);
    expect(mockStrategy).not.toHaveBeenCalled();
  });

  it("should return multiple results when sending multiple notifications", async () => {
    const sender = createMockSender(
      () => true,
      async () => {},
    );

    const notif1 = { ...notification, message: "1" };
    const notif2 = { ...notification, message: "2" };
    const notif3 = { ...notification, message: "3" };

    const failError = new Error("Fail");
    const mockStrategy = vi
      .fn()
      .mockResolvedValueOnce({ success: true, notification: notif1 })
      .mockRejectedValueOnce(failError)
      .mockResolvedValueOnce({ success: true, notification: notif3 });
    strategyRegistry[DEFAULT_STRATEGY_KEY] = mockStrategy;

    const service = createNotificationDeliveryService({
      senders: [sender],
    });

    const result = await service.send([notif1, notif2, notif3]);

    expect(result).toHaveLength(3);
    expect(result[0]).toEqual<SendResult>({
      success: true,
      notification: notif1,
    });
    expect(result[1]).toEqual<SendResult>({
      success: false,
      notification: notif2,
      error: failError,
    });
    expect(result[2]).toEqual<SendResult>({
      success: true,
      notification: notif3,
    });
  });

  it("should call checkHealth on all senders that support it", async () => {
    const healthySender = createMockSender(
      () => true,
      async () => {},
      async () => {},
    );

    const unhealthySender = createMockSender(
      () => true,
      async () => {},
      async () => {
        throw new Error("Service down");
      },
    );

    const noHealthSender = createMockSender(
      () => true,
      async () => {},
    );

    const service = createNotificationDeliveryService({
      senders: [healthySender, unhealthySender, noHealthSender],
    });

    await expect(service.checkHealth!()).rejects.toThrow(
      "Часть сендров не готова к работе",
    );

    expect(healthySender.checkHealth).toHaveBeenCalled();
    expect(unhealthySender.checkHealth).toHaveBeenCalled();
    expect(noHealthSender.checkHealth).toBeUndefined();
  });

  it("should throw if no sender has checkHealth method", async () => {
    const senderWithoutHealth = createMockSender(
      () => true,
      async () => {},
    );
    const service = createNotificationDeliveryService({
      senders: [senderWithoutHealth],
    });

    await expect(service.checkHealth!()).rejects.toThrow(
      "Нет доступных проверок работоспособности",
    );
  });

  it("should succeed checkHealth if all health checks pass", async () => {
    const sender1 = createMockSender(
      () => true,
      async () => {},
      async () => {},
    );

    const sender2 = createMockSender(
      () => true,
      async () => {},
      async () => {},
    );

    const service = createNotificationDeliveryService({
      senders: [sender1, sender2],
    });

    await expect(service.checkHealth!()).resolves.not.toThrow();

    expect(sender1.checkHealth).toHaveBeenCalled();
    expect(sender2.checkHealth).toHaveBeenCalled();
  });

  it("should propagate cause from failed health check", async () => {
    const originalError = new Error("Database unreachable");
    const failingHealthCheck = vi.fn().mockRejectedValue(originalError);

    const sender = createMockSender(
      () => true,
      async () => {},
      failingHealthCheck,
    );

    const service = createNotificationDeliveryService({
      senders: [sender],
    });

    try {
      await service.checkHealth!();
    } catch (error: unknown) {
      if (error instanceof Error) {
        expect(error.message).toBe("Часть сендров не готова к работе");
        expect(error.cause).toBe(originalError);
      } else {
        throw new Error("Expected error to be instance of Error");
      }
    }
  });
});
