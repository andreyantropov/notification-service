import { describe, it, expect, vi, beforeEach } from "vitest";

import { createDeliveryService } from "./createDeliveryService.js";
import type { Result } from "./interfaces/index.js";
import { CHANNEL_TYPES } from "@notification-platform/shared";
import { DeliveryStrategy } from "@notification-platform/shared";
import type { Channel } from "../../../domain/ports/index.js";
import type { Notification } from "@notification-platform/shared";

const emailContact = {
  type: CHANNEL_TYPES.EMAIL,
  value: "test@example.com",
} as const satisfies import("@notification-platform/shared").Contact;

const baseNotification: Omit<Notification, "id" | "createdAt"> = {
  contacts: [emailContact],
  message: "Test message",
} satisfies Omit<Notification, "id" | "createdAt">;

const createNotification = (
  overrides: Partial<Notification> = {},
): Notification => ({
  id: "test-id",
  createdAt: "2025-01-01T00:00:00.000Z",
  ...baseNotification,
  ...overrides,
}) satisfies Notification;

const createMockChannel = (
  isSupports: (contact: import("@notification-platform/shared").Contact) => boolean,
  checkHealthImpl?: () => Promise<void>,
): Channel => {
  return {
    type: CHANNEL_TYPES.EMAIL,
    isSupports,
    send: vi.fn(),
    checkHealth: checkHealthImpl ? vi.fn(checkHealthImpl) : undefined,
  } satisfies Channel;
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
    (channel.send as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

    const notification = createNotification();
    const service = createDeliveryService({ channels: [channel] });
    const result = await service.send([notification]);

    expect(result).toEqual<Result[]>([{ status: "success", notification }]);
    expect(channel.send).toHaveBeenCalledWith(notification);
  });

  it("should use sendToFirstAvailableStrategy when strategy is sendToFirstAvailable", async () => {
    const channel = createMockChannel(() => true);
    (channel.send as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

    const notification = createNotification({
      strategy: DeliveryStrategy.sendToFirstAvailable,
    });

    const service = createDeliveryService({ channels: [channel] });
    const result = await service.send([notification]);

    expect(result).toEqual<Result[]>([{ status: "success", notification }]);
    expect(channel.send).toHaveBeenCalledWith(notification);
  });

  it("should use sendToAllAvailableStrategy when strategy is sendToAllAvailable", async () => {
    const channel = createMockChannel(() => true);
    (channel.send as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

    const notification = createNotification({
      strategy: DeliveryStrategy.sendToAllAvailable,
    });

    const service = createDeliveryService({ channels: [channel] });
    const result = await service.send([notification]);

    expect(result).toEqual<Result[]>([{ status: "success", notification }]);
    expect(channel.send).toHaveBeenCalledWith(notification);
  });

  it("should return failure result when channel.send rejects", async () => {
    const channel = createMockChannel(() => true);
    const sendError = new Error("SMTP timeout");
    (channel.send as ReturnType<typeof vi.fn>).mockRejectedValue(sendError);

    const notification = createNotification();
    const service = createDeliveryService({ channels: [channel] });
    const result = await service.send([notification]);

    expect(result).toEqual<Result[]>([
      { status: "failure", notification, error: sendError },
    ]);
  });

  it("should handle array of notifications", async () => {
    const channel = createMockChannel(() => true);
    (channel.send as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce(new Error("Failed"));

    const notif1 = createNotification({ message: "Msg 1" });
    const notif2 = createNotification({ message: "Msg 2" });

    const service = createDeliveryService({ channels: [channel] });
    const result = await service.send([notif1, notif2]);

    expect(result).toEqual<Result[]>([
      { status: "success", notification: notif1 },
      { status: "failure", notification: notif2, error: expect.any(Error) },
    ]);
    expect(channel.send).toHaveBeenCalledTimes(2);
  });

  it("should return empty result array when empty input array is provided", async () => {
    const channel = createMockChannel(() => true);
    const service = createDeliveryService({ channels: [channel] });
    const result = await service.send([]);

    expect(result).toEqual([]);
    expect(channel.send).not.toHaveBeenCalled();
  });

  it("should call checkHealth on all channels that support it", async () => {
    const healthyChannel = createMockChannel(
      () => true,
      async () => { },
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
    const channel1 = createMockChannel(() => true, async () => { });
    const channel2 = createMockChannel(() => true, async () => { });

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

    const service = createDeliveryService({ channels: [channel] });

    try {
      await service.checkHealth!();
      expect.unreachable();
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
      expect((error as Error).message).toBe("Часть сендров не готова к работе");
      expect((error as Error).cause).toBe(originalError);
    }
  });
});