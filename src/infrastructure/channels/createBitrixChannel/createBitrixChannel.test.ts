import axios from "axios";
import { describe, it, expect, vi, beforeEach } from "vitest";

import { createBitrixChannel } from "./createBitrixChannel.js";
import { BitrixChannelConfig } from "./interfaces/index.js";
import { Channel } from "../../../domain/ports/index.js";
import { Contact, CHANNEL_TYPES } from "../../../domain/types/index.js";

vi.mock("axios");

describe("createBitrixChannel", () => {
  const mockBaseUrl = "https://example.bitrix24.com";
  const mockUserId = "123";
  const mockAuthToken = "abcxyz123";

  let channel: Channel;
  let config: BitrixChannelConfig;

  beforeEach(() => {
    config = {
      baseUrl: mockBaseUrl,
      userId: mockUserId,
      authToken: mockAuthToken,
    };
    channel = createBitrixChannel(config);
  });

  it("should return a channel with isSupports, send, and checkHealth methods", () => {
    expect(channel).toHaveProperty("isSupports");
    expect(channel).toHaveProperty("send");
    expect(channel).toHaveProperty("checkHealth");
    expect(typeof channel.isSupports).toBe("function");
    expect(typeof channel.send).toBe("function");
    expect(typeof channel.checkHealth).toBe("function");
  });

  describe("isSupports", () => {
    it("should return true for a bitrix contact", () => {
      const contact: Contact = { type: CHANNEL_TYPES.BITRIX, value: 42 };
      expect(channel.isSupports(contact)).toBe(true);
    });

    it("should return false for a non-bitrix contact", () => {
      const contact: Contact = {
        type: CHANNEL_TYPES.EMAIL,
        value: "test@example.com",
      };
      expect(channel.isSupports(contact)).toBe(false);
    });
  });

  describe("send", () => {
    const message = "Test message";
    const contact: Contact = { type: CHANNEL_TYPES.BITRIX, value: 42 };
    const restUrl = `${mockBaseUrl}/rest/${mockUserId}/${mockAuthToken}`;

    it("should send a notification via axios with correct params", async () => {
      const axiosPostMock = vi.mocked(axios.post).mockResolvedValue({
        data: { result: true },
      });

      await channel.send(contact, message);

      expect(axiosPostMock).toHaveBeenCalledWith(
        `${restUrl}/im.notify.personal.add.json`,
        null,
        {
          params: {
            user_id: contact.value,
            message,
          },
          timeout: 10000,
        },
      );
    });

    it("should resolve if Bitrix returns success result", async () => {
      vi.mocked(axios.post).mockResolvedValue({
        data: { result: true },
      });

      await expect(channel.send(contact, message)).resolves.not.toThrow();
    });

    it("should reject if Bitrix returns success status but no result", async () => {
      vi.mocked(axios.post).mockResolvedValue({
        data: { result: false },
      });

      await expect(channel.send(contact, message)).rejects.toThrow(
        "Не удалось отправить уведомление через Bitrix",
      );
    });

    it("should throw error if contact is not bitrix", async () => {
      const invalidContact: Contact = {
        type: CHANNEL_TYPES.EMAIL,
        value: "test@example.com",
      };

      await expect(channel.send(invalidContact, message)).rejects.toThrow(
        `Неверный тип получателя: ожидается id пользователя Bitrix, получено "email"`,
      );
    });

    it("should throw an error if axios request fails", async () => {
      const error = new Error("Network error");
      vi.mocked(axios.post).mockRejectedValue(error);

      await expect(channel.send(contact, message)).rejects.toThrow(
        "Не удалось отправить уведомление через Bitrix",
      );
    });

    it("should reject with timeout error if axios.post hangs", async () => {
      vi.useFakeTimers();

      vi.mocked(axios.post).mockReturnValue(new Promise(() => {}));

      const sendPromise = channel.send(contact, message);

      vi.advanceTimersByTime(10_001);

      await expect(sendPromise).rejects.toThrow(
        "Не удалось отправить уведомление через Bitrix",
      );

      vi.useRealTimers();
    });
  });

  describe("checkHealth", () => {
    it("should resolve if axios.get returns 200", async () => {
      vi.mocked(axios.get).mockResolvedValue({
        data: "<html>Авторизация</html>",
      });

      await expect(channel.checkHealth!()).resolves.not.toThrow();
    });

    it("should reject if axios.get fails", async () => {
      const error = new Error("Network unreachable");
      vi.mocked(axios.get).mockRejectedValue(error);

      await expect(channel.checkHealth!()).rejects.toThrow("Bitrix недоступен");
    });

    it("should reject if request times out", async () => {
      const timeoutError = new Error(
        "Превышено время ожидания ответа от Bitrix",
      );
      vi.mocked(axios.get).mockRejectedValue(timeoutError);

      await expect(channel.checkHealth!()).rejects.toThrow("Bitrix недоступен");
    });

    it("should reject on 500 error", async () => {
      vi.mocked(axios.get).mockRejectedValue(
        Object.assign(new Error("Request failed"), {
          response: { status: 500 },
        }),
      );

      await expect(channel.checkHealth!()).rejects.toThrow("Bitrix недоступен");
    });

    it("should reject on 404", async () => {
      vi.mocked(axios.get).mockRejectedValue(
        Object.assign(new Error("Not Found"), {
          response: { status: 404 },
        }),
      );

      await expect(channel.checkHealth!()).rejects.toThrow("Bitrix недоступен");
    });

    it("should reject with timeout error if axios.get hangs", async () => {
      vi.useFakeTimers();

      vi.mocked(axios.get).mockReturnValue(new Promise(() => {}));

      const healthPromise = channel.checkHealth!();

      vi.advanceTimersByTime(5_001);

      await expect(healthPromise).rejects.toThrow("Bitrix недоступен");

      vi.useRealTimers();
    });
  });
});
