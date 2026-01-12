import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Mock } from "vitest";

import { createDeliveryService } from "./createDeliveryService.js";
import type { Result } from "./interfaces/index.js";
import {
  sendToFirstAvailableStrategy,
  sendToAllAvailableStrategy,
} from "./strategies/index.js";
import { CHANNEL_TYPES } from "../../../domain/constants/index.js";
import { DeliveryStrategy } from "../../../domain/enums/index.js";
import type { Channel } from "../../../domain/ports/index.js";
import type { Notification } from "../../../domain/types/index.js";

vi.mock("./strategies/index.js", () => ({
  sendToFirstAvailableStrategy: vi.fn(),
  sendToAllAvailableStrategy: vi.fn(),
}));

const mockedSendToFirst = sendToFirstAvailableStrategy as Mock;
const mockedSendToAll = sendToAllAvailableStrategy as Mock;

const emailContact = {
  type: CHANNEL_TYPES.EMAIL,
  value: "test@example.com",
} as const;

const baseNotification: Omit<Notification, "id" | "createdAt"> = {
  contacts: [emailContact],
  message: "Test message",
};

const createNotification = (
  overrides: Partial<Notification> = {},
): Notification => ({
  id: "test-id",
  createdAt: "2025-01-01T00:00:00.000Z",
  ...baseNotification,
  ...overrides,
});

const createMockChannel = (
  isSupports: (contact: unknown) => boolean,
  checkHealthImpl?: () => Promise<void>,
): Channel => {
  return {
    type: CHANNEL_TYPES.EMAIL,
    isSupports,
    send: vi.fn(),
    checkHealth: checkHealthImpl ? vi.fn(checkHealthImpl) : undefined,
  };
};

describe("createDeliveryService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should throw if no channels are provided", () => {
    expect(() =>
      createDeliveryService({
        channels: [],
      }),
    ).toThrow("В сервис не передано ни одного канала");
  });

  it("should use default strategy (sendToFirstAvailable) if not provided", async () => {
    const channel = createMockChannel(() => true);
    const notification = createNotification();

    const mockResult: Result = { status: "success", notification };
    mockedSendToFirst.mockResolvedValue(mockResult);

    const service = createDeliveryService({
      channels: [channel],
    });

    const result = await service.send([notification]);

    expect(result).toEqual([mockResult]);
    expect(mockedSendToFirst).toHaveBeenCalledWith(notification, [channel]);
  });

  it("should use sendToFirstAvailableStrategy when strategy is sendToFirstAvailable", async () => {
    const channel = createMockChannel(() => true);
    const notification = createNotification({
      strategy: DeliveryStrategy.sendToFirstAvailable,
    });

    const mockResult: Result = { status: "success", notification };
    mockedSendToFirst.mockResolvedValue(mockResult);

    const service = createDeliveryService({
      channels: [channel],
    });

    const result = await service.send([notification]);

    expect(result).toEqual([mockResult]);
    expect(mockedSendToFirst).toHaveBeenCalledWith(notification, [channel]);
    expect(mockedSendToAll).not.toHaveBeenCalled();
  });

  it("should use sendToAllAvailableStrategy when strategy is sendToAllAvailable", async () => {
    const channel = createMockChannel(() => true);
    const notification = createNotification({
      strategy: DeliveryStrategy.sendToAllAvailable,
    });

    const mockResult: Result = { status: "success", notification };
    mockedSendToAll.mockResolvedValue(mockResult);

    const service = createDeliveryService({
      channels: [channel],
    });

    const result = await service.send([notification]);

    expect(result).toEqual([mockResult]);
    expect(mockedSendToAll).toHaveBeenCalledWith(notification, [channel]);
    expect(mockedSendToFirst).not.toHaveBeenCalled();
  });

  it("should return success result when strategy succeeds", async () => {
    const channel = createMockChannel(() => true);
    const notification = createNotification();

    const mockResult: Result = { status: "success", notification };
    mockedSendToFirst.mockResolvedValue(mockResult);

    const service = createDeliveryService({
      channels: [channel],
    });

    const result = await service.send([notification]);

    expect(result).toEqual([mockResult]);
  });

  it("should return error result when strategy throws", async () => {
    const channel = createMockChannel(() => true);
    const notification = createNotification();

    const strategyError = new Error("Delivery failed");
    mockedSendToFirst.mockRejectedValue(strategyError);

    const service = createDeliveryService({
      channels: [channel],
    });

    const result = await service.send([notification]);

    expect(result).toEqual<Result[]>([
      {
        status: "failure",
        notification,
        error: strategyError,
      },
    ]);
  });

  it("should handle array of notifications", async () => {
    const channel = createMockChannel(() => true);
    const notif1 = createNotification({ message: "Msg 1" });
    const notif2 = createNotification({ message: "Msg 2" });

    const failError = new Error("Failed");
    mockedSendToFirst
      .mockResolvedValueOnce({ status: "success", notification: notif1 })
      .mockRejectedValueOnce(failError);

    const service = createDeliveryService({
      channels: [channel],
    });

    const result = await service.send([notif1, notif2]);

    expect(result).toEqual<Result[]>([
      { status: "success", notification: notif1 },
      { status: "failure", notification: notif2, error: failError },
    ]);

    expect(mockedSendToFirst).toHaveBeenCalledTimes(2);
  });

  it("should return empty result array when empty input array is provided", async () => {
    const channel = createMockChannel(() => true);
    const service = createDeliveryService({
      channels: [channel],
    });

    const result = await service.send([]);

    expect(result).toEqual([]);
    expect(mockedSendToFirst).not.toHaveBeenCalled();
  });

  it("should call checkHealth on all channels that support it", async () => {
    const healthyChannel = createMockChannel(
      () => true,
      async () => {},
    );

    const unhealthyChannel = createMockChannel(
      () => true,
      async () => {
        throw new Error("Service down");
      },
    );

    const noHealthChannel = createMockChannel(() => true);

    const service = createDeliveryService({
      channels: [healthyChannel, unhealthyChannel, noHealthChannel],
    });

    await expect(service.checkHealth!()).rejects.toThrow(
      "Часть сендров не готова к работе",
    );

    expect(healthyChannel.checkHealth).toHaveBeenCalled();
    expect(unhealthyChannel.checkHealth).toHaveBeenCalled();
  });

  it("should throw if no channel has checkHealth method", async () => {
    const channelWithoutHealth = createMockChannel(() => true);
    const service = createDeliveryService({
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
    );
    const channel2 = createMockChannel(
      () => true,
      async () => {},
    );

    const service = createDeliveryService({
      channels: [channel1, channel2],
    });

    await expect(service.checkHealth!()).resolves.not.toThrow();
  });

  it("should propagate cause from failed health check", async () => {
    const originalError = new Error("Database unreachable");
    const channel = createMockChannel(
      () => true,
      async () => {
        throw originalError;
      },
    );

    const service = createDeliveryService({
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
