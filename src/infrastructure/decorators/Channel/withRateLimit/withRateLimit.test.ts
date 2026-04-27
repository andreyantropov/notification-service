import { setTimeout } from "node:timers/promises";

import pLimit from "p-limit";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { type Channel } from "../../../../domain/ports/index.js";
import { type Contact } from "../../../../domain/types/index.js";

import {
  type RateLimitConfig,
  type RateLimitDependencies,
} from "./interfaces/index.js";
import { withRateLimit } from "./withRateLimit.js";

vi.mock("p-limit", () => ({
  default: vi.fn(() => {
    return (fn: () => Promise<unknown>) => fn();
  }),
}));

vi.mock("node:timers/promises", () => ({
  setTimeout: vi.fn().mockResolvedValue(undefined),
}));

describe("withRateLimit", () => {
  let mockChannel: Channel;
  const mockConfig: RateLimitConfig = {
    concurrency: 2,
    delayMs: 100,
  };

  const mockContact: Contact = { type: "email", value: "test@test.com" };

  beforeEach(() => {
    vi.clearAllMocks();

    mockChannel = {
      type: "email",
      send: vi.fn().mockResolvedValue(undefined),
      checkHealth: vi.fn().mockResolvedValue(undefined),
      isSupports: vi.fn().mockReturnValue(true),
    } as unknown as Channel;
  });

  const getDeps = (): RateLimitDependencies => ({
    channel: mockChannel,
  });

  it("should initialize p-limit with correct concurrency", async () => {
    withRateLimit(getDeps(), mockConfig);
    expect(pLimit).toHaveBeenCalledWith(mockConfig.concurrency);
  });

  describe("send", () => {
    it("should call channel.send and then wait for delayMs", async () => {
      const decorated = withRateLimit(getDeps(), mockConfig);

      await decorated.send(mockContact, "hello");

      expect(mockChannel.send).toHaveBeenCalledWith(mockContact, "hello");
      expect(setTimeout).toHaveBeenCalledWith(mockConfig.delayMs);
    });

    it("should not call setTimeout if delayMs is 0", async () => {
      const configNoDelay = { ...mockConfig, delayMs: 0 };
      const decorated = withRateLimit(getDeps(), configNoDelay);

      await decorated.send(mockContact, "hello");

      expect(mockChannel.send).toHaveBeenCalled();
      expect(setTimeout).not.toHaveBeenCalled();
    });

    it("should wait for delayMs even if channel.send fails", async () => {
      vi.mocked(mockChannel.send).mockRejectedValue(new Error("Send Error"));
      const decorated = withRateLimit(getDeps(), mockConfig);

      await expect(decorated.send(mockContact, "hello")).rejects.toThrow(
        "Send Error",
      );

      expect(setTimeout).toHaveBeenCalledWith(mockConfig.delayMs);
    });
  });

  describe("checkHealth", () => {
    it("should wrap checkHealth if it exists on original channel", async () => {
      const decorated = withRateLimit(getDeps(), mockConfig);

      if (!decorated.checkHealth) {
        throw new Error("checkHealth should be defined");
      }

      await decorated.checkHealth();

      expect(mockChannel.checkHealth).toHaveBeenCalled();
      expect(setTimeout).toHaveBeenCalledWith(mockConfig.delayMs);
    });

    it("should be undefined if original channel has no checkHealth", () => {
      const channelNoHealth = {
        type: "email",
        send: vi.fn(),
        isSupports: vi.fn(),
      } as unknown as Channel;

      const decorated = withRateLimit({ channel: channelNoHealth }, mockConfig);

      expect(decorated.checkHealth).toBeUndefined();
    });
  });
});
