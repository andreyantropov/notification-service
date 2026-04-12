import axios from "axios";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { CHANNEL_TYPE, type Contact } from "../../../domain/types/index.js";

import { createBitrixChannel } from "./createBitrixChannel.js";
import { type BitrixChannelConfig } from "./interfaces/index.js";

vi.mock("axios");

describe("createBitrixChannel", () => {
  const mockConfig: BitrixChannelConfig = {
    baseUrl: "https://test.bitrix24.ru",
    userId: "1",
    authToken: "token123",
    timeoutMs: 5000,
  };

  const bitrixContact: Contact = {
    type: CHANNEL_TYPE.BITRIX,
    value: 777,
  };

  const emailContact: Contact = {
    type: CHANNEL_TYPE.EMAIL,
    value: "test@test.com",
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("isSupports", () => {
    it("should return true for bitrix contact", () => {
      const channel = createBitrixChannel(mockConfig);
      expect(channel.isSupports(bitrixContact)).toBe(true);
    });

    it("should return false for email contact", () => {
      const channel = createBitrixChannel(mockConfig);
      expect(channel.isSupports(emailContact)).toBe(false);
    });
  });

  describe("send", () => {
    it("should send notification successfully", async () => {
      const channel = createBitrixChannel(mockConfig);
      vi.mocked(axios.post).mockResolvedValueOnce({ data: { result: true } });

      await channel.send(bitrixContact, "Hello Bitrix");

      expect(axios.post).toHaveBeenCalledWith(
        `${mockConfig.baseUrl}/rest/${mockConfig.userId}/${mockConfig.authToken}/im.notify.personal.add.json`,
        {
          user_id: bitrixContact.value,
          message: "Hello Bitrix",
        },
        { timeout: mockConfig.timeoutMs },
      );
    });

    it("should throw error if bitrix returns result: false", async () => {
      const channel = createBitrixChannel(mockConfig);
      vi.mocked(axios.post).mockResolvedValueOnce({ data: { result: false } });

      await expect(channel.send(bitrixContact, "msg")).rejects.toThrow(
        "Не удалось отправить уведомление через Bitrix",
      );
    });

    it("should throw error for unsupported contact type", async () => {
      const channel = createBitrixChannel(mockConfig);

      await expect(channel.send(emailContact, "msg")).rejects.toThrow(
        `Неверный тип получателя: ожидается id пользователя Bitrix, получено "${CHANNEL_TYPE.EMAIL}"`,
      );
    });

    it("should wrap axios errors", async () => {
      const channel = createBitrixChannel(mockConfig);
      vi.mocked(axios.post).mockRejectedValueOnce(new Error("Network Error"));

      await expect(channel.send(bitrixContact, "msg")).rejects.toThrow(
        "Не удалось отправить уведомление через Bitrix",
      );
    });
  });

  describe("checkHealth", () => {
    it("should resolve when server returns time", async () => {
      const channel = createBitrixChannel(mockConfig);
      vi.mocked(axios.get).mockResolvedValueOnce({
        data: { result: "2023-01-01" },
      });

      await expect(channel.checkHealth?.()).resolves.toBeUndefined();
    });

    it("should throw error when server is unreachable", async () => {
      const channel = createBitrixChannel(mockConfig);
      vi.mocked(axios.get).mockRejectedValueOnce(new Error("Timeout"));

      await expect(channel.checkHealth?.()).rejects.toThrow(
        "Bitrix недоступен",
      );
    });
  });
});
