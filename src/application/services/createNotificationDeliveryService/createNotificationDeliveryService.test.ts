import { describe, it, expect, vi, beforeEach } from "vitest";

import { createNotificationDeliveryService } from "./createNotificationDeliveryService.js";
import { DeliveryResult } from "./interfaces/DeliveryResult.js";
import {
  strategyRegistry,
  DEFAULT_STRATEGY_KEY,
} from "./strategies/strategyRegistry.js";
import { Channel } from "../../../domain/ports/Channel.js";
import { Notification } from "../../../domain/types/Notification.js";

const emailContact = { type: "email", value: "test@example.com" } as const;
const message = "Test message";
const notification: Notification = {
  contacts: [emailContact],
  message,
  id: "",
};

const createMockChannel = (
  isSupports: (contact: unknown) => boolean,
  sendImpl: () => Promise<void>,
  checkHealthImpl?: () => Promise<void>,
): Channel => {
  return {
    type: "bitrix",
    isSupports,
    send: vi.fn(sendImpl),
    checkHealth: checkHealthImpl ? vi.fn(checkHealthImpl) : undefined,
  };
};

describe("createNotificationDeliveryService", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("should throw if no channels are provided", () => {
    expect(() =>
      createNotificationDeliveryService({
        channels: [],
      }),
    ).toThrow("В сервис не передано ни одного канала");
  });

  it("should use default strategy if not provided", async () => {
    const channel = createMockChannel(
      () => true,
      async () => {},
    );
    const mockDefaultStrategy = vi.fn().mockResolvedValue({
      success: true,
      notification,
    });

    strategyRegistry[DEFAULT_STRATEGY_KEY] = mockDefaultStrategy;

    const service = createNotificationDeliveryService({
      channels: [channel],
    });

    await service.send([notification]);

    expect(mockDefaultStrategy).toHaveBeenCalledWith(notification, [channel]);
  });

  it("should return success result when strategy succeeds", async () => {
    const channel = createMockChannel(
      () => true,
      async () => {},
    );

    const mockStrategy = vi.fn().mockResolvedValue({
      success: true,
      notification,
    });
    strategyRegistry[DEFAULT_STRATEGY_KEY] = mockStrategy;

    const service = createNotificationDeliveryService({
      channels: [channel],
    });

    const result = await service.send([notification]);

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      success: true,
      notification,
    });
    expect(mockStrategy).toHaveBeenCalledWith(notification, [channel]);
  });

  it("should return error result when strategy fails", async () => {
    const channel = createMockChannel(
      () => true,
      async () => {},
    );

    const strategyError = new Error("Delivery failed");
    const mockStrategy = vi.fn().mockRejectedValue(strategyError);
    strategyRegistry[DEFAULT_STRATEGY_KEY] = mockStrategy;

    const service = createNotificationDeliveryService({
      channels: [channel],
    });

    const result = await service.send([notification]);

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual<DeliveryResult>({
      success: false,
      notification,
      error: strategyError,
    });
    expect(mockStrategy).toHaveBeenCalledWith(notification, [channel]);
  });

  it("should handle array of notifications", async () => {
    const channel = createMockChannel(
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
      channels: [channel],
    });

    const result = await service.send([notification1, notification2]);

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual<DeliveryResult>({
      success: true,
      notification: notification1,
    });
    expect(result[1]).toEqual<DeliveryResult>({
      success: false,
      notification: notification2,
      error: failError,
    });

    expect(mockStrategy).toHaveBeenNthCalledWith(1, notification1, [channel]);
    expect(mockStrategy).toHaveBeenNthCalledWith(2, notification2, [channel]);
  });

  it("should handle single notification (object)", async () => {
    const channel = createMockChannel(
      () => true,
      async () => {},
    );

    const mockStrategy = vi
      .fn()
      .mockResolvedValue({ success: true, notification });
    strategyRegistry[DEFAULT_STRATEGY_KEY] = mockStrategy;

    const service = createNotificationDeliveryService({
      channels: [channel],
    });

    const result = await service.send([notification]);

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual<DeliveryResult>({
      success: true,
      notification,
    });
  });

  it("should return empty result array when empty input array is provided", async () => {
    const channel = createMockChannel(
      () => true,
      async () => {},
    );

    const mockStrategy = vi.fn();
    strategyRegistry[DEFAULT_STRATEGY_KEY] = mockStrategy;

    const service = createNotificationDeliveryService({
      channels: [channel],
    });

    const result = await service.send([]);

    expect(result).toEqual([]);
    expect(mockStrategy).not.toHaveBeenCalled();
  });

  it("should return multiple results when sending multiple notifications", async () => {
    const channel = createMockChannel(
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
      channels: [channel],
    });

    const result = await service.send([notif1, notif2, notif3]);

    expect(result).toHaveLength(3);
    expect(result[0]).toEqual<DeliveryResult>({
      success: true,
      notification: notif1,
    });
    expect(result[1]).toEqual<DeliveryResult>({
      success: false,
      notification: notif2,
      error: failError,
    });
    expect(result[2]).toEqual<DeliveryResult>({
      success: true,
      notification: notif3,
    });
  });

  it("should call checkHealth on all channels that support it", async () => {
    const healthyChannel = createMockChannel(
      () => true,
      async () => {},
      async () => {},
    );

    const unhealthyChannel = createMockChannel(
      () => true,
      async () => {},
      async () => {
        throw new Error("Service down");
      },
    );

    const noHealthChannel = createMockChannel(
      () => true,
      async () => {},
    );

    const service = createNotificationDeliveryService({
      channels: [healthyChannel, unhealthyChannel, noHealthChannel],
    });

    await expect(service.checkHealth!()).rejects.toThrow(
      "Часть сендров не готова к работе",
    );

    expect(healthyChannel.checkHealth).toHaveBeenCalled();
    expect(unhealthyChannel.checkHealth).toHaveBeenCalled();
    expect(noHealthChannel.checkHealth).toBeUndefined();
  });

  it("should throw if no channel has checkHealth method", async () => {
    const channelWithoutHealth = createMockChannel(
      () => true,
      async () => {},
    );
    const service = createNotificationDeliveryService({
      channels: [channelWithoutHealth],
    });

    await expect(service.checkHealth!()).rejects.toThrow(
      "Нет доступных проверок работоспособности",
    );
  });

  it("should succeed checkHealth if all health checks pass", async () => {
    const channel1 = createMockChannel(
      () => true,
      async () => {},
      async () => {},
    );

    const channel2 = createMockChannel(
      () => true,
      async () => {},
      async () => {},
    );

    const service = createNotificationDeliveryService({
      channels: [channel1, channel2],
    });

    await expect(service.checkHealth!()).resolves.not.toThrow();

    expect(channel1.checkHealth).toHaveBeenCalled();
    expect(channel2.checkHealth).toHaveBeenCalled();
  });

  it("should propagate cause from failed health check", async () => {
    const originalError = new Error("Database unreachable");
    const failingHealthCheck = vi.fn().mockRejectedValue(originalError);

    const channel = createMockChannel(
      () => true,
      async () => {},
      failingHealthCheck,
    );

    const service = createNotificationDeliveryService({
      channels: [channel],
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
