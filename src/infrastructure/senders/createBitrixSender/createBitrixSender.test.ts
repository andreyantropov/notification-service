import axios from "axios";
import { describe, it, expect, vi, beforeEach } from "vitest";

import { createBitrixSender } from "./createBitrixSender.js";
import { BitrixSenderConfig } from "./interfaces/BitrixSenderConfig.js";
import { Sender } from "../../../domain/ports/Sender.js";
import { Recipient } from "../../../domain/types/Recipient.js";

vi.mock("axios");

describe("createBitrixSender", () => {
  const mockBaseUrl = "https://example.bitrix24.com";
  const mockUserId = "123";
  const mockAuthToken = "abcxyz123";

  let sender: Sender;
  let config: BitrixSenderConfig;

  beforeEach(() => {
    config = {
      baseUrl: mockBaseUrl,
      userId: mockUserId,
      authToken: mockAuthToken,
    };
    sender = createBitrixSender(config);
  });

  it("should return a sender with isSupports, send, and checkHealth methods", () => {
    expect(sender).toHaveProperty("isSupports");
    expect(sender).toHaveProperty("send");
    expect(sender).toHaveProperty("checkHealth");
    expect(typeof sender.isSupports).toBe("function");
    expect(typeof sender.send).toBe("function");
    expect(typeof sender.checkHealth).toBe("function");
  });

  describe("isSupports", () => {
    it("should return true for a bitrix recipient", () => {
      const recipient: Recipient = { type: "bitrix", value: 42 };
      expect(sender.isSupports(recipient)).toBe(true);
    });

    it("should return false for a non-bitrix recipient", () => {
      const recipient: Recipient = { type: "email", value: "test@example.com" };
      expect(sender.isSupports(recipient)).toBe(false);
    });
  });

  describe("send", () => {
    const message = "Test message";
    const recipient: Recipient = { type: "bitrix", value: 42 };
    const restUrl = `${mockBaseUrl}/rest/${mockUserId}/${mockAuthToken}`;

    it("should send a notification via axios with correct params", async () => {
      const axiosPostMock = vi.mocked(axios.post).mockResolvedValue({
        data: { result: true },
      });

      await sender.send(recipient, message);

      expect(axiosPostMock).toHaveBeenCalledWith(
        `${restUrl}/im.notify.personal.add.json`,
        null,
        {
          params: {
            user_id: recipient.value,
            message,
          },
        },
      );
    });

    it("should resolve if Bitrix returns success result", async () => {
      vi.mocked(axios.post).mockResolvedValue({
        data: { result: true },
      });

      await expect(sender.send(recipient, message)).resolves.not.toThrow();
    });

    it("should reject if Bitrix returns success status but no result", async () => {
      vi.mocked(axios.post).mockResolvedValue({
        data: { result: false },
      });

      await expect(sender.send(recipient, message)).rejects.toThrow(
        "Не удалось отправить уведомление через Bitrix",
      );
    });

    it("should throw error if recipient is not bitrix", async () => {
      const invalidRecipient: Recipient = {
        type: "email",
        value: "test@example.com",
      };

      await expect(sender.send(invalidRecipient, message)).rejects.toThrow(
        `Неверный тип получателя: ожидается id пользователя Bitrix, получено "email"`,
      );
    });

    it("should throw an error if axios request fails", async () => {
      const error = new Error("Network error");
      vi.mocked(axios.post).mockRejectedValue(error);

      await expect(sender.send(recipient, message)).rejects.toThrow(
        "Не удалось отправить уведомление через Bitrix",
      );
    });
  });

  describe("checkHealth", () => {
    it("should resolve if axios.get returns 200", async () => {
      vi.mocked(axios.get).mockResolvedValue({
        data: "<html>Авторизация</html>",
      });

      await expect(sender.checkHealth!()).resolves.not.toThrow();
    });

    it("should reject if axios.get fails", async () => {
      const error = new Error("Network unreachable");
      vi.mocked(axios.get).mockRejectedValue(error);

      await expect(sender.checkHealth!()).rejects.toThrow("Bitrix недоступен");
    });

    it("should reject if request times out", async () => {
      const timeoutError = new Error(
        "Превышено время ожидания ответа от Bitrix",
      );
      vi.mocked(axios.get).mockRejectedValue(timeoutError);

      await expect(sender.checkHealth!()).rejects.toThrow("Bitrix недоступен");
    });

    it("should reject on 500 error", async () => {
      vi.mocked(axios.get).mockRejectedValue(
        Object.assign(new Error("Request failed"), {
          response: { status: 500 },
        }),
      );

      await expect(sender.checkHealth!()).rejects.toThrow("Bitrix недоступен");
    });

    it("should reject on 404", async () => {
      vi.mocked(axios.get).mockRejectedValue(
        Object.assign(new Error("Not Found"), {
          response: { status: 404 },
        }),
      );

      await expect(sender.checkHealth!()).rejects.toThrow("Bitrix недоступен");
    });
  });
});
