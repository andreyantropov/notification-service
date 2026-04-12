import { beforeEach, describe, expect, it, vi } from "vitest";

import { CHANNEL_TYPE, type Contact } from "../../../domain/types/index.js";

import { createMockEmailChannel } from "./createMockEmailChannel.js";

describe("createMockEmailChannel (Mock Implementation)", () => {
  const emailContact: Contact = {
    type: CHANNEL_TYPE.EMAIL,
    value: "target@test.com",
  };

  const bitrixContact: Contact = {
    type: CHANNEL_TYPE.BITRIX,
    value: 12345,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "log").mockImplementation(() => {});
  });

  describe("isSupports", () => {
    it("should return true for email contact", () => {
      const channel = createMockEmailChannel();
      expect(channel.isSupports(emailContact)).toBe(true);
    });

    it("should return false for bitrix contact", () => {
      const channel = createMockEmailChannel();
      expect(channel.isSupports(bitrixContact)).toBe(false);
    });
  });

  describe("send", () => {
    it("should log email message to console successfully", async () => {
      const channel = createMockEmailChannel();
      const message = "Hello Mock Email";

      await expect(
        channel.send(emailContact, message),
      ).resolves.toBeUndefined();

      expect(console.log).toHaveBeenCalledWith(
        `[MOCK EMAIL] To: ${emailContact.value} | Message: ${message}`,
      );
    });

    it("should throw error when trying to send to non-email contact", async () => {
      const channel = createMockEmailChannel();

      await expect(channel.send(bitrixContact, "msg")).rejects.toThrow(
        `Неверный тип получателя: ожидается email, получено "${CHANNEL_TYPE.BITRIX}"`,
      );
    });
  });

  describe("checkHealth", () => {
    it("should be undefined if not implemented", () => {
      const channel = createMockEmailChannel();
      expect(channel.checkHealth).toBeUndefined();
    });
  });
});
