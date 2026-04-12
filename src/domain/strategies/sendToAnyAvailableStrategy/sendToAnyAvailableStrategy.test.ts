import { beforeEach, describe, expect, it, vi } from "vitest";

import { type Channel } from "../../ports/index.js";
import { type Contact, type Notification } from "../../types/index.js";
import { type Attempt, getAttempts } from "../utils/index.js";

import { sendToAnyAvailableStrategy } from "./sendToAnyAvailableStrategy.js";

vi.mock("../utils/index.js", () => ({
  getAttempts: vi.fn(),
}));

describe("sendToAnyAvailableStrategy", () => {
  const mockNotification = {
    contacts: [],
    message: "Test message for any",
  } as unknown as Notification;

  const createMockChannel = (): Channel =>
    ({
      send: vi.fn(),
    }) as unknown as Channel;

  const mockContact1: Contact = { type: "email", value: "1@test.com" };
  const mockContact2: Contact = { type: "bitrix", value: 12345 };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should call send on any available channels simultaneously", async () => {
    const channel1 = createMockChannel();
    const channel2 = createMockChannel();

    vi.mocked(getAttempts).mockReturnValue([
      { channel: channel1, contact: mockContact1 },
      { channel: channel2, contact: mockContact2 },
    ] as Attempt[]);

    vi.mocked(channel1.send).mockResolvedValue(undefined);
    vi.mocked(channel2.send).mockResolvedValue(undefined);

    await sendToAnyAvailableStrategy(mockNotification, [channel1, channel2]);

    expect(channel1.send).toHaveBeenCalledWith(
      mockContact1,
      mockNotification.message,
    );
    expect(channel2.send).toHaveBeenCalledWith(
      mockContact2,
      mockNotification.message,
    );
  });

  it("should succeed if at least one attempt is fulfilled", async () => {
    const channel1 = createMockChannel();
    const channel2 = createMockChannel();

    vi.mocked(getAttempts).mockReturnValue([
      { channel: channel1, contact: mockContact1 },
      { channel: channel2, contact: mockContact2 },
    ] as Attempt[]);

    vi.mocked(channel1.send).mockRejectedValue(new Error("Fail"));
    vi.mocked(channel2.send).mockResolvedValue(undefined);

    await expect(
      sendToAnyAvailableStrategy(mockNotification, [channel1, channel2]),
    ).resolves.toBeUndefined();
  });

  it("should throw error only if all attempts are rejected", async () => {
    const channel1 = createMockChannel();
    vi.mocked(getAttempts).mockReturnValue([
      { channel: channel1, contact: mockContact1 },
    ] as Attempt[]);

    vi.mocked(channel1.send).mockRejectedValue(new Error("Full fail"));

    await expect(
      sendToAnyAvailableStrategy(mockNotification, [channel1]),
    ).rejects.toThrow(
      "Все попытки отправки уведомления (1 шт.) завершились неудачей",
    );
  });

  it("should throw error if no attempts were generated", async () => {
    vi.mocked(getAttempts).mockReturnValue([]);

    const promise = sendToAnyAvailableStrategy(mockNotification, []);

    await expect(promise).rejects.toThrow(
      "Все попытки отправки уведомления (0 шт.) завершились неудачей",
    );
  });
});
