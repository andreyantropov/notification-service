import { describe, it, expect, vi, type Mock } from "vitest";

import { createMeteredChannel } from "./createMeteredChannel.js";
import { MeteredChannelDependencies } from "./interfaces/index.js";
import { Channel } from "../../../../domain/ports/index.js";
import { Contact, CHANNEL_TYPES } from "../../../../domain/types/index.js";

const mockContact: Contact = {
  type: CHANNEL_TYPES.EMAIL,
  value: "test@example.com",
};
const mockMessage = "Test message";

const createMockChannel = (): Channel => ({
  type: CHANNEL_TYPES.EMAIL,
  isSupports: vi.fn().mockReturnValue(true),
  send: vi.fn().mockResolvedValue(undefined),
  checkHealth: vi.fn().mockResolvedValue(undefined),
});

const createMockMeter = () => ({
  recordChannelLatency: vi.fn(),
  incrementNotificationsByChannel: vi.fn(),

  incrementTotalNotifications: vi.fn(),
  incrementNotificationsProcessedByResult: vi.fn(),
  incrementNotificationsProcessedBySubject: vi.fn(),
  incrementNotificationsProcessedByStrategy: vi.fn(),
  incrementNotificationsByPriority: vi.fn(),
});

describe("createMeteredChannel", () => {
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
    const mockMeter = createMockMeter();
    const dependencies: MeteredChannelDependencies = {
      channel: mockChannel,
      meter: mockMeter,
    };

    const meteredChannel = createMeteredChannel(dependencies);

    await meteredChannel.send(mockContact, mockMessage);

    expect(mockChannel.send).toHaveBeenCalledWith(mockContact, mockMessage);
    expect(mockMeter.recordChannelLatency).toHaveBeenCalled();

    const latencyCall = (mockMeter.recordChannelLatency as Mock).mock.calls[0];
    expect(latencyCall[0]).toBeGreaterThanOrEqual(0);
    expect(latencyCall[1]).toEqual({
      channel: CHANNEL_TYPES.EMAIL,
      result: "success",
    });

    expect(mockMeter.incrementNotificationsByChannel).toHaveBeenCalledWith(
      CHANNEL_TYPES.EMAIL,
      "success",
    );
  });

  it("should record failure metrics and rethrow error when channel send fails", async () => {
    const mockChannel = createMockChannel();

    mockChannel.send = vi.fn().mockImplementation(async () => {
      throw new Error("Send failed");
    });

    const mockMeter = createMockMeter();
    const dependencies: MeteredChannelDependencies = {
      channel: mockChannel,
      meter: mockMeter,
    };

    const meteredChannel = createMeteredChannel(dependencies);

    await expect(meteredChannel.send(mockContact, mockMessage)).rejects.toThrow(
      "Send failed",
    );

    expect(mockChannel.send).toHaveBeenCalledWith(mockContact, mockMessage);
    expect(mockMeter.recordChannelLatency).toHaveBeenCalled();

    const latencyCall = (mockMeter.recordChannelLatency as Mock).mock.calls[0];
    expect(latencyCall[0]).toBeGreaterThanOrEqual(0);
    expect(latencyCall[1]).toEqual({
      channel: CHANNEL_TYPES.EMAIL,
      result: "failure",
    });

    expect(mockMeter.incrementNotificationsByChannel).toHaveBeenCalledWith(
      CHANNEL_TYPES.EMAIL,
      "failure",
    );
  });

  it("should calculate latency correctly for successful operation", async () => {
    const mockChannel = createMockChannel();
    const mockMeter = createMockMeter();
    const dependencies: MeteredChannelDependencies = {
      channel: mockChannel,
      meter: mockMeter,
    };

    const meteredChannel = createMeteredChannel(dependencies);

    const startTime = Date.now();
    await meteredChannel.send(mockContact, mockMessage);
    const endTime = Date.now();

    const recordedLatency = (mockMeter.recordChannelLatency as Mock).mock
      .calls[0][0];
    const expectedLatencyRange = endTime - startTime;

    expect(recordedLatency).toBeGreaterThanOrEqual(0);
    expect(recordedLatency).toBeLessThanOrEqual(expectedLatencyRange + 10);
  });

  it("should calculate latency correctly for failed operation", async () => {
    const mockChannel = createMockChannel();

    mockChannel.send = vi.fn().mockImplementation(async () => {
      throw new Error("Send failed");
    });

    const mockMeter = createMockMeter();
    const dependencies: MeteredChannelDependencies = {
      channel: mockChannel,
      meter: mockMeter,
    };

    const meteredChannel = createMeteredChannel(dependencies);

    const startTime = Date.now();

    try {
      await meteredChannel.send(mockContact, mockMessage);
      expect("Should have thrown error").toBe(false);
    } catch (error) {
      expect((error as Error).message).toBe("Send failed");
    }

    const endTime = Date.now();

    const recordedLatency = (mockMeter.recordChannelLatency as Mock).mock
      .calls[0][0];
    const expectedLatencyRange = endTime - startTime;

    expect(recordedLatency).toBeGreaterThanOrEqual(0);
    expect(recordedLatency).toBeLessThanOrEqual(expectedLatencyRange + 10);
  });

  it("should preserve isSupports functionality from original channel", () => {
    const mockChannel = createMockChannel();
    mockChannel.isSupports = vi.fn().mockReturnValue(false);

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
    };
    const mockChannel: Channel = {
      type: CHANNEL_TYPES.BITRIX,
      isSupports: vi.fn().mockReturnValue(true),
      send: vi.fn().mockResolvedValue(undefined),
    };

    const mockMeter = createMockMeter();
    const dependencies: MeteredChannelDependencies = {
      channel: mockChannel,
      meter: mockMeter,
    };

    const meteredChannel = createMeteredChannel(dependencies);

    await meteredChannel.send(mockBitrixContact, mockMessage);

    expect(mockChannel.send).toHaveBeenCalledWith(
      mockBitrixContact,
      mockMessage,
    );
    expect(mockMeter.incrementNotificationsByChannel).toHaveBeenCalledWith(
      CHANNEL_TYPES.BITRIX,
      "success",
    );
  });
});
