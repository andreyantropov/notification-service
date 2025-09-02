import { describe, it, expect, vi, beforeEach } from "vitest";
import { createNotificationDeliveryService } from "./createNotificationDeliveryService";
import { Sender } from "../../../domain/ports/Sender.js";
import { Notification } from "../../../domain/types/Notification.js";
import { DeliveryStrategy } from "./types/DeliveryStrategy.js";

const emailRecipient = { type: "email", value: "test@example.com" } as const;
const message = "Test message";
const notification: Notification = {
  recipients: [emailRecipient],
  message,
};

const createMockSender = (
  isSupports: (recipient: unknown) => boolean,
  sendImpl: () => Promise<void>,
  checkHealthImpl?: () => Promise<void>,
) => {
  const sender: Sender = {
    isSupports,
    send: vi.fn(sendImpl),
    checkHealth: checkHealthImpl ? vi.fn(checkHealthImpl) : undefined,
  };
  return sender;
};

const createMockStrategy = (impl: DeliveryStrategy) => {
  return vi.fn<DeliveryStrategy>(impl);
};

describe("createNotificationDeliveryService", () => {
  let onError: ReturnType<typeof vi.fn>;
  let mockStrategy: ReturnType<typeof createMockStrategy>;

  beforeEach(() => {
    onError = vi.fn();
    mockStrategy = createMockStrategy(async () => {});
  });

  it("should throw if no senders are provided", () => {
    expect(() => createNotificationDeliveryService([])).toThrow(
      "В сервис не передано ни одного сендера",
    );
  });

  it("should use default strategy (sendToFirstAvailable) if not provided", () => {
    const sender = createMockSender(
      () => true,
      async () => {},
    );
    const service = createNotificationDeliveryService([sender]);

    expect(service).toHaveProperty("send");
    expect(service).toHaveProperty("checkHealth");
  });

  it("should return success result when strategy succeeds", async () => {
    const sender = createMockSender(
      () => true,
      async () => {},
    );
    const service = createNotificationDeliveryService([sender], mockStrategy, {
      onError,
    });

    const result = await service.send(notification);

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      success: true,
      notification,
    });
    expect(mockStrategy).toHaveBeenCalledWith([sender], notification, onError);
  });

  it("should return error result when strategy fails", async () => {
    const sender = createMockSender(
      () => true,
      async () => {},
    );
    const service = createNotificationDeliveryService([sender], mockStrategy, {
      onError,
    });

    const strategyError = new Error("Delivery failed");
    mockStrategy.mockRejectedValueOnce(strategyError);

    const result = await service.send(notification);

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      success: false,
      notification,
      error: strategyError,
    });
    expect(mockStrategy).toHaveBeenCalledWith([sender], notification, onError);
  });

  it("should handle array of notifications", async () => {
    const sender = createMockSender(
      () => true,
      async () => {},
    );
    const service = createNotificationDeliveryService([sender], mockStrategy);

    const notification1 = { ...notification, message: "Msg 1" };
    const notification2 = { ...notification, message: "Msg 2" };

    const failError = new Error("Failed");
    mockStrategy
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce(failError);

    const result = await service.send([notification1, notification2]);

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({
      success: true,
      notification: notification1,
    });
    expect(result[1]).toEqual({
      success: false,
      notification: notification2,
      error: failError,
    });

    expect(mockStrategy).toHaveBeenNthCalledWith(
      1,
      [sender],
      notification1,
      expect.any(Function),
    );
    expect(mockStrategy).toHaveBeenNthCalledWith(
      2,
      [sender],
      notification2,
      expect.any(Function),
    );
  });

  it("should handle single notification (object)", async () => {
    const sender = createMockSender(
      () => true,
      async () => {},
    );
    const service = createNotificationDeliveryService([sender], mockStrategy);

    mockStrategy.mockResolvedValue(undefined);

    const result = await service.send(notification);

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      success: true,
      notification,
    });
  });

  it("should return empty result array when empty input array is provided", async () => {
    const sender = createMockSender(
      () => true,
      async () => {},
    );
    const service = createNotificationDeliveryService([sender]);

    const result = await service.send([]);

    expect(result).toEqual([]);
  });

  it("should return multiple results when sending multiple notifications", async () => {
    const sender = createMockSender(
      () => true,
      async () => {},
    );
    const service = createNotificationDeliveryService([sender], mockStrategy);

    const notif1 = { ...notification, message: "1" };
    const notif2 = { ...notification, message: "2" };
    const notif3 = { ...notification, message: "3" };

    const failError = new Error("Fail");
    mockStrategy
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce(failError)
      .mockResolvedValueOnce(undefined);

    const result = await service.send([notif1, notif2, notif3]);

    expect(result).toHaveLength(3);
    expect(result[0]).toEqual({
      success: true,
      notification: notif1,
    });
    expect(result[1]).toEqual({
      success: false,
      notification: notif2,
      error: failError,
    });
    expect(result[2]).toEqual({
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

    const service = createNotificationDeliveryService([
      healthySender,
      unhealthySender,
      noHealthSender,
    ]);

    await expect(service.checkHealth!()).rejects.toThrow(
      "Часть сендров не готова к работе",
    );

    expect(healthySender.checkHealth).toHaveBeenCalled();
    expect(unhealthySender.checkHealth).toHaveBeenCalled();
    expect(noHealthSender.checkHealth).not.toBeDefined();
  });

  it("should throw if no sender has checkHealth method", async () => {
    const senderWithoutHealth = createMockSender(
      () => true,
      async () => {},
    );
    const service = createNotificationDeliveryService([senderWithoutHealth]);

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

    const service = createNotificationDeliveryService([sender1, sender2]);

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

    const service = createNotificationDeliveryService([sender]);

    await expect(service.checkHealth!()).rejects.toThrow(
      "Часть сендров не готова к работе",
    );

    const error = await service.checkHealth!().catch((e) => e);
    expect(error.cause).toBe(originalError);
  });
});
