import { describe, it, expect, vi, beforeEach } from "vitest";
import { createNotificationDeliveryService } from "./createNotificationDeliveryService";
import { NotificationSender } from "../../../domain/interfaces/NotificationSender.js";
import { Notification } from "../../../domain/interfaces/Notification.js";
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
  const sender: NotificationSender = {
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

  it("should pass senders and notification to the strategy", async () => {
    const sender = createMockSender(
      () => true,
      async () => {},
    );
    const service = createNotificationDeliveryService([sender], mockStrategy, {
      onError,
    });

    await service.send(notification);

    expect(mockStrategy).toHaveBeenCalledWith([sender], notification, onError);
  });

  it("should use custom onError from config", async () => {
    const sender = createMockSender(
      () => true,
      async () => {},
    );
    const customOnError = vi.fn();
    const service = createNotificationDeliveryService([sender], mockStrategy, {
      onError: customOnError,
    });

    mockStrategy.mockRejectedValueOnce(new Error("Strategy failed"));

    await expect(service.send(notification)).rejects.toThrow("Strategy failed");
    expect(mockStrategy).toHaveBeenCalled();
    expect(mockStrategy).toHaveBeenCalledWith(
      [sender],
      notification,
      customOnError,
    );
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

  it("should throw original strategy error through send", async () => {
    const sender = createMockSender(
      () => true,
      async () => {},
    );
    const service = createNotificationDeliveryService([sender], mockStrategy);

    const strategyError = new Error("Delivery failed");
    mockStrategy.mockRejectedValueOnce(strategyError);

    await expect(service.send(notification)).rejects.toThrow("Delivery failed");
    expect(mockStrategy).toHaveBeenCalledWith(
      [sender],
      notification,
      expect.any(Function),
    );
  });
});
