import { beforeEach, describe, expect, it, vi } from "vitest";

import { CHANNEL_TYPE, type Contact } from "../../../domain/types/index.js";

import { createMockBitrixChannel } from "./createMockBitrixChannel.js";

describe("createMockBitrixChannel (Mock Implementation)", () => {
  const bitrixContact: Contact = {
    type: CHANNEL_TYPE.BITRIX,
    value: 42,
  };

  const emailContact: Contact = {
    type: CHANNEL_TYPE.EMAIL,
    value: "test@test.com",
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "log").mockImplementation(() => {});
  });

  describe("isSupports", () => {
    it("should return true for bitrix contact", () => {
      const channel = createMockBitrixChannel();
      expect(channel.isSupports(bitrixContact)).toBe(true);
    });

    it("should return false for email contact", () => {
      const channel = createMockBitrixChannel();
      expect(channel.isSupports(emailContact)).toBe(false);
    });
  });

  describe("send", () => {
    it("should log message to console successfully", async () => {
      const channel = createMockBitrixChannel();
      const message = "Hello Bitrix";

      await expect(
        channel.send(bitrixContact, message),
      ).resolves.toBeUndefined();

      expect(console.log).toHaveBeenCalledWith(
        "[MOCK BITRIX] To: 42 | Message: Hello Bitrix",
      );
    });

    it("should throw error for unsupported contact type", async () => {
      const channel = createMockBitrixChannel();

      await expect(channel.send(emailContact, "msg")).rejects.toThrow(
        `Неверный тип получателя: ожидается id пользователя Bitrix, получено "${CHANNEL_TYPE.EMAIL}"`,
      );
    });
  });
});
