import { describe, it, expect, vi, beforeEach } from "vitest";
import axios from "axios";
import { createBitrixSender } from "./bitrixSender.js";
import { BitrixSenderConfig } from "./interfaces/BitrixSenderConfig.js";
import { NotificationSender } from "../../../domain/interfaces/NotificationSender.js";
import { Recipient } from "../../../domain/types/Recipient.js";

vi.mock("axios");

describe("createBitrixSender", () => {
  const mockUrl = "https://example.bitrix24.com/rest/123";
  let sender: NotificationSender;
  let config: BitrixSenderConfig;

  beforeEach(() => {
    config = { url: mockUrl };
    sender = createBitrixSender(config);
  });

  it("should return a sender with isSupports and send methods", () => {
    expect(sender).toHaveProperty("isSupports");
    expect(sender).toHaveProperty("send");
    expect(typeof sender.isSupports).toBe("function");
    expect(typeof sender.send).toBe("function");
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

    it("should send a notification via axios with correct params", async () => {
      const axiosPostMock = vi.mocked(axios.post).mockResolvedValue({
        data: { result: true },
      });

      await sender.send(recipient, message);

      expect(axiosPostMock).toHaveBeenCalledWith(
        `${mockUrl}/im.notify.personal.add.json`,
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
    it("should have checkHealth method", () => {
      expect(sender.checkHealth).toBeDefined();
      expect(typeof sender.checkHealth).toBe("function");
    });

    it("should resolve if health check returns valid data", async () => {
      const mockData = { result: true };
      vi.mocked(axios.get).mockResolvedValue({ data: mockData });

      await expect(sender.checkHealth!()).resolves.not.toThrow();
    });

    it("should reject with 'Bitrix недоступен' if any error occurs", async () => {
      const mockError = new Error("Some network problem");
      vi.mocked(axios.get).mockRejectedValue(mockError);

      await expect(sender.checkHealth!()).rejects.toThrow("Bitrix недоступен");
    });

    it("should reject with 'Bitrix недоступен' on timeout", async () => {
      const timeoutError = new Error(
        "Превышено время ожидания ответа от Bitrix",
      );
      vi.mocked(axios.get).mockRejectedValue(timeoutError);

      await expect(sender.checkHealth!()).rejects.toThrow("Bitrix недоступен");
    });

    it("should reject with 'Bitrix недоступен' on invalid response format", async () => {
      const mockData = { wrongKey: "unexpected data" };
      vi.mocked(axios.get).mockResolvedValue({ data: mockData });

      await expect(sender.checkHealth!()).rejects.toThrow("Bitrix недоступен");
    });
  });
});
