import { beforeEach, describe, expect, it, vi } from "vitest";

import { type Channel } from "../../ports/index.js";
import { type Contact, type Notification } from "../../types/index.js";
import { type Attempt, getAttempts } from "../utils/index.js";

import { sendToFirstAvailableStrategy } from "./sendToFirstAvailableStrategy.js";

vi.mock("../utils/index.js", () => ({
  getAttempts: vi.fn(),
}));

describe("sendToFirstAvailableStrategy", () => {
  const mockNotification = {
    contacts: [],
    message: "Test message",
  } as unknown as Notification;

  const createMockChannel = (): Channel =>
    ({
      send: vi.fn(),
    }) as unknown as Channel;

  const mockContact1: Contact = { type: "email", value: "1@test.com" };
  const mockContact2: Contact = { type: "email", value: "2@test.com" };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return immediately after the first successful send", async () => {
    const channel1 = createMockChannel();
    const channel2 = createMockChannel();

    vi.mocked(getAttempts).mockReturnValue([
      { channel: channel1, contact: mockContact1 },
      { channel: channel2, contact: mockContact2 },
    ] as Attempt[]);

    vi.mocked(channel1.send).mockResolvedValue(undefined);

    await sendToFirstAvailableStrategy(mockNotification, [channel1, channel2]);

    expect(channel1.send).toHaveBeenCalledTimes(1);
    expect(channel2.send).not.toHaveBeenCalled();
  });

  it("should continue to next attempt if previous one failed", async () => {
    const channel1 = createMockChannel();
    const channel2 = createMockChannel();

    vi.mocked(getAttempts).mockReturnValue([
      { channel: channel1, contact: mockContact1 },
      { channel: channel2, contact: mockContact2 },
    ] as Attempt[]);

    vi.mocked(channel1.send).mockRejectedValue(new Error("Failed"));
    vi.mocked(channel2.send).mockResolvedValue(undefined);

    await sendToFirstAvailableStrategy(mockNotification, [channel1, channel2]);

    expect(channel1.send).toHaveBeenCalledWith(
      mockContact1,
      mockNotification.message,
    );
    expect(channel2.send).toHaveBeenCalledWith(
      mockContact2,
      mockNotification.message,
    );
  });

  it("should throw error if all attempts failed", async () => {
    const channel = createMockChannel();
    vi.mocked(getAttempts).mockReturnValue([
      { channel, contact: mockContact1 },
    ] as Attempt[]);

    vi.mocked(channel.send).mockRejectedValue(new Error("Always fails"));

    await expect(
      sendToFirstAvailableStrategy(mockNotification, [channel]),
    ).rejects.toThrow(
      "Все попытки отправки уведомления (1 шт.) завершились неудачей",
    );
  });

  it("should throw error if there are no attempts available", async () => {
    vi.mocked(getAttempts).mockReturnValue([]);

    const promise = sendToFirstAvailableStrategy(mockNotification, []);

    await expect(promise).rejects.toThrow(
      "Все попытки отправки уведомления (0 шт.) завершились неудачей",
    );
  });
});
