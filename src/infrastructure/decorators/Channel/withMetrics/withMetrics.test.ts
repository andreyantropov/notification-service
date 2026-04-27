import { beforeEach, describe, expect, it, vi } from "vitest";

import { type Channel } from "../../../../domain/ports/index.js";
import { type Contact } from "../../../../domain/types/index.js";
import { type Meter } from "../../../telemetry/index.js";

import { type MetricsDependencies } from "./interfaces/index.js";
import { withMetrics } from "./withMetrics.js";

describe("withMetrics (Channel)", () => {
  let mockChannel: Channel;
  let mockMeter: Meter;

  const mockContact: Contact = { type: "email", value: "test@test.com" };
  const mockMessage = "Test message";

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-01-01T00:00:00Z"));

    mockChannel = {
      type: "email",
      send: vi.fn().mockResolvedValue(undefined),
      isSupports: vi.fn().mockReturnValue(true),
    } as unknown as Channel;

    mockMeter = {
      add: vi.fn(),
      gauge: vi.fn(),
      increment: vi.fn(),
      record: vi.fn(),
    };
  });

  const getDeps = (): MetricsDependencies => ({
    channel: mockChannel,
    meter: mockMeter,
  });

  it("should record success metrics with correct duration when send succeeds", async () => {
    const decorated = withMetrics(getDeps());

    const sendPromise = decorated.send(mockContact, mockMessage);
    vi.advanceTimersByTime(150);
    await sendPromise;

    expect(mockMeter.increment).toHaveBeenCalledWith(
      "notifications_sent_total",
      {
        status: "success",
        channel: mockChannel.type,
      },
    );

    expect(mockMeter.record).toHaveBeenCalledWith(
      "notifications_sent_duration_ms",
      150,
      { status: "success", channel: mockChannel.type },
    );
  });

  it("should record error metrics and rethrow when send fails", async () => {
    const sendError = new Error("Network fail");
    vi.mocked(mockChannel.send).mockRejectedValue(sendError);

    const decorated = withMetrics(getDeps());

    const sendPromise = decorated.send(mockContact, mockMessage);
    vi.advanceTimersByTime(50);

    await expect(sendPromise).rejects.toThrow(sendError);

    expect(mockMeter.increment).toHaveBeenCalledWith(
      "notifications_sent_total",
      {
        status: "error",
        channel: mockChannel.type,
      },
    );

    expect(mockMeter.record).toHaveBeenCalledWith(
      "notifications_sent_duration_ms",
      50,
      { status: "error", channel: mockChannel.type },
    );
  });

  it("should preserve original channel properties", () => {
    const decorated = withMetrics(getDeps());
    expect(decorated.type).toBe("email");

    decorated.isSupports(mockContact);
    expect(mockChannel.isSupports).toHaveBeenCalledWith(mockContact);
  });
});
