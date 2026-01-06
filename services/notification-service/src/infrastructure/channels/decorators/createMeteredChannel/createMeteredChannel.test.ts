import { describe, it, expect, vi, beforeEach } from "vitest";

import { createMeteredChannel } from "./createMeteredChannel.js";
import type { MeteredChannelDependencies } from "./interfaces/index.js";
import { CHANNEL_TYPES } from "@notification-platform/shared";
import type { Channel } from "../../../../domain/ports/index.js";
import type { Contact } from "@notification-platform/shared";
import {
  NOTIFICATIONS_CHANNEL_SEND_DURATION_MS,
  NOTIFICATIONS_PROCESSED_BY_CHANNEL_TOTAL,
} from "./constants/index.js";

const mockContact: Contact = {
  type: CHANNEL_TYPES.EMAIL,
  value: "test@example.com",
} as const satisfies Contact;

const mockMessage = "Test message";

const createMockChannel = (): Channel => ({
  type: CHANNEL_TYPES.EMAIL,
  isSupports: vi.fn().mockReturnValue(true),
  send: vi.fn(),
  checkHealth: vi.fn().mockResolvedValue(undefined),
}) satisfies Channel;

const createMockMeter = () => ({
  increment: vi.fn<(name: string, labels?: Record<string, string>) => void>(),
  record: vi.fn<(name: string, value: number, labels?: Record<string, string>) => void>(),
});

describe("createMeteredChannel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return a channel with same type and methods as original channel", () => {
    const mockChannel = createMockChannel();
    const mockMeter = createMockMeter();
    const dependencies: MeteredChannelDependencies = {
      channel: mockChannel,
      meter: mockMeter,
    };

    const meteredChannel = createMeteredChannel(dependencies);

    expect(meteredChannel.type).toBe(mockChannel.type);
    expect(meteredChannel.isSupports).toBe(mockChannel.isSupports);
    expect(meteredChannel.checkHealth).toBe(mockChannel.checkHealth);
    expect(typeof meteredChannel.send).toBe("function");
  });

  it("should call original channel send method and record success metrics", async () => {
    const mockChannel = createMockChannel();
    (mockChannel.send as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

    const mockMeter = createMockMeter();
    const dependencies: MeteredChannelDependencies = {
      channel: mockChannel,
      meter: mockMeter,
    };

    const meteredChannel = createMeteredChannel(dependencies);
    await meteredChannel.send(mockContact, mockMessage);

    expect(mockChannel.send).toHaveBeenCalledWith(mockContact, mockMessage);

    expect(mockMeter.record).toHaveBeenCalledWith(
      NOTIFICATIONS_CHANNEL_SEND_DURATION_MS,
      expect.any(Number),
      { channel: CHANNEL_TYPES.EMAIL, status: "success" }
    );

    expect(mockMeter.increment).toHaveBeenCalledWith(
      NOTIFICATIONS_PROCESSED_BY_CHANNEL_TOTAL,
      { channel: CHANNEL_TYPES.EMAIL, status: "success" }
    );
  });

  it("should record failure metrics and rethrow error when channel send fails", async () => {
    const mockChannel = createMockChannel();
    const sendError = new Error("Send failed");
    (mockChannel.send as ReturnType<typeof vi.fn>).mockRejectedValue(sendError);

    const mockMeter = createMockMeter();
    const dependencies: MeteredChannelDependencies = {
      channel: mockChannel,
      meter: mockMeter,
    };

    const meteredChannel = createMeteredChannel(dependencies);

    await expect(meteredChannel.send(mockContact, mockMessage)).rejects.toThrow(sendError);

    expect(mockChannel.send).toHaveBeenCalledWith(mockContact, mockMessage);

    expect(mockMeter.record).toHaveBeenCalledWith(
      NOTIFICATIONS_CHANNEL_SEND_DURATION_MS,
      expect.any(Number),
      { channel: CHANNEL_TYPES.EMAIL, status: "failure" }
    );

    expect(mockMeter.increment).toHaveBeenCalledWith(
      NOTIFICATIONS_PROCESSED_BY_CHANNEL_TOTAL,
      { channel: CHANNEL_TYPES.EMAIL, status: "failure" }
    );
  });

  it("should calculate latency correctly (within reasonable bounds)", async () => {
    const mockChannel = createMockChannel();
    (mockChannel.send as ReturnType<typeof vi.fn>).mockImplementation(async () => {
      await new Promise(resolve => setTimeout(resolve, 5));
    });

    const mockMeter = createMockMeter();
    const dependencies: MeteredChannelDependencies = {
      channel: mockChannel,
      meter: mockMeter,
    };

    const meteredChannel = createMeteredChannel(dependencies);
    await meteredChannel.send(mockContact, mockMessage);

    const recordedLatency = (mockMeter.record as ReturnType<typeof vi.fn>).mock.calls[0][1];
    expect(recordedLatency).toBeGreaterThanOrEqual(5);
    expect(recordedLatency).toBeLessThan(100);
  });

  it("should preserve isSupports functionality from original channel", () => {
    const mockChannel = createMockChannel();
    (mockChannel.isSupports as ReturnType<typeof vi.fn>).mockReturnValue(false);

    const mockMeter = createMockMeter();
    const dependencies: MeteredChannelDependencies = {
      channel: mockChannel,
      meter: mockMeter,
    };

    const meteredChannel = createMeteredChannel(dependencies);
    const result = meteredChannel.isSupports(mockContact);

    expect(result).toBe(false);
    expect(mockChannel.isSupports).toHaveBeenCalledWith(mockContact);
  });

  it("should preserve checkHealth functionality from original channel", async () => {
    const mockChannel = createMockChannel();
    const mockMeter = createMockMeter();
    const dependencies: MeteredChannelDependencies = {
      channel: mockChannel,
      meter: mockMeter,
    };

    const meteredChannel = createMeteredChannel(dependencies);
    await meteredChannel.checkHealth?.();

    expect(mockChannel.checkHealth).toHaveBeenCalled();
  });

  it("should work with bitrix channel type", async () => {
    const mockBitrixContact: Contact = {
      type: CHANNEL_TYPES.BITRIX,
      value: 123,
    } as const satisfies Contact;

    const mockChannel: Channel = {
      type: CHANNEL_TYPES.BITRIX,
      isSupports: vi.fn().mockReturnValue(true),
      send: vi.fn().mockResolvedValue(undefined),
    } satisfies Channel;

    const mockMeter = createMockMeter();
    const dependencies: MeteredChannelDependencies = {
      channel: mockChannel,
      meter: mockMeter,
    };

    const meteredChannel = createMeteredChannel(dependencies);
    await meteredChannel.send(mockBitrixContact, mockMessage);

    expect(mockChannel.send).toHaveBeenCalledWith(mockBitrixContact, mockMessage);
    expect(mockMeter.increment).toHaveBeenCalledWith(
      NOTIFICATIONS_PROCESSED_BY_CHANNEL_TOTAL,
      { channel: CHANNEL_TYPES.BITRIX, status: "success" }
    );
  });
});