import { beforeEach, describe, expect, it, vi } from "vitest";

import { type Channel } from "../../ports/index.js";
import { type Contact, type Notification } from "../../types/index.js";
import { type Attempt, getAttempts } from "../utils/index.js";

import { sendToAllAvailableStrategy } from "./sendToAllAvailableStrategy.js";

vi.mock("../utils/index.js", () => ({
  getAttempts: vi.fn(),
}));

describe("sendToAllAvailableStrategy", () => {
  const mockNotification = {
    contacts: [],
    message: "Test message for all",
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

  it("should succeed only if ALL channels sent successfully", async () => {
    const channel1 = createMockChannel();
    const channel2 = createMockChannel();

    vi.mocked(getAttempts).mockReturnValue([
      { channel: channel1, contact: mockContact1 },
      { channel: channel2, contact: mockContact2 },
    ] as Attempt[]);

    vi.mocked(channel1.send).mockResolvedValue(undefined);
    vi.mocked(channel2.send).mockResolvedValue(undefined);

    await expect(
      sendToAllAvailableStrategy(mockNotification, [channel1, channel2]),
    ).resolves.toBeUndefined();

    expect(channel1.send).toHaveBeenCalledWith(
      mockContact1,
      mockNotification.message,
    );
    expect(channel2.send).toHaveBeenCalledWith(
      mockContact2,
      mockNotification.message,
    );
  });

  it("should resolve immediately if no attempts were generated", async () => {
    vi.mocked(getAttempts).mockReturnValue([]);

    await expect(
      sendToAllAvailableStrategy(mockNotification, []),
    ).resolves.toBeUndefined();
  });

  it("should call all channels simultaneously", async () => {
    const channel1 = createMockChannel();
    const channel2 = createMockChannel();

    vi.mocked(getAttempts).mockReturnValue([
      { channel: channel1, contact: mockContact1 },
      { channel: channel2, contact: mockContact2 },
    ] as Attempt[]);

    let channel2Called = false;
    vi.mocked(channel1.send).mockImplementation(async () => {
      await new Promise((res) => setTimeout(res, 20));
    });
    vi.mocked(channel2.send).mockImplementation(async () => {
      channel2Called = true;
    });

    await sendToAllAvailableStrategy(mockNotification, [channel1, channel2]);

    expect(channel2Called).toBe(true);
    expect(channel1.send).toHaveBeenCalled();
  });

  it("should call all channels simultaneously", async () => {
    const channel1 = createMockChannel();
    const channel2 = createMockChannel();

    vi.mocked(getAttempts).mockReturnValue([
      { channel: channel1, contact: mockContact1 },
      { channel: channel2, contact: mockContact2 },
    ] as Attempt[]);

    let channel2Called = false;
    vi.mocked(channel1.send).mockImplementation(async () => {
      await new Promise((res) => setTimeout(res, 10));
    });
    vi.mocked(channel2.send).mockImplementation(async () => {
      channel2Called = true;
    });

    await sendToAllAvailableStrategy(mockNotification, [channel1, channel2]);

    expect(channel2Called).toBe(true);
    expect(channel1.send).toHaveBeenCalled();
  });
});
