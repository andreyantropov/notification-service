import { describe, it, expect, vi, beforeEach } from "vitest";
import { createFallbackSender } from "./createFallbackSender.js";
import { Recipient } from "../../../domain/types/Recipient.js";
import { NotificationSender } from "../../../domain/interfaces/NotificationSender.js";

const mockEmailRecipient: Recipient = {
  type: "email",
  value: "test@example.com",
};

const mockBitrixRecipient: Recipient = {
  type: "bitrix",
  value: 42,
};

const createMockSender = (
  type: string,
  shouldFail = false,
): NotificationSender => {
  return {
    isSupports: (recipient) => recipient.type === type,
    send: vi.fn().mockImplementation(() => {
      if (shouldFail) {
        return Promise.reject(new Error(`Ошибка отправки через ${type}`));
      }
      return Promise.resolve();
    }),
  };
};

describe("createFallbackSender", () => {
  it("should throw error if no senders provided", () => {
    expect(() => createFallbackSender([])).toThrow(
      "Не передано ни одного сендера",
    );
  });

  describe("isSupports", () => {
    it("should return true if any sender supports the recipient", () => {
      const emailSender = createMockSender("email");
      const bitrixSender = createMockSender("bitrix");

      const sender = createFallbackSender([emailSender, bitrixSender]);

      expect(sender.isSupports(mockEmailRecipient)).toBe(true);
      expect(sender.isSupports(mockBitrixRecipient)).toBe(true);
    });

    it("should return false if no sender supports the recipient", () => {
      const emailSender = createMockSender("email");
      const sender = createFallbackSender([emailSender]);

      expect(sender.isSupports(mockBitrixRecipient)).toBe(false);
    });
  });

  describe("send", () => {
    let onError: (
      attempt: { recipient: Recipient; message: string },
      error: Error,
    ) => void;

    beforeEach(() => {
      onError = vi.fn();
    });

    it("should call send on the correct sender and succeed", async () => {
      const emailSender = createMockSender("email");
      const fallbackSender = createFallbackSender([emailSender], { onError });

      await expect(
        fallbackSender.send(mockEmailRecipient, "Hello"),
      ).resolves.not.toThrow();

      expect(emailSender.send).toHaveBeenCalledWith(
        mockEmailRecipient,
        "Hello",
      );
    });

    it("should try next sender if current one fails", async () => {
      const failingEmailSender = createMockSender("email", true);
      const workingEmailSender = createMockSender("email");

      const fallbackSender = createFallbackSender(
        [failingEmailSender, workingEmailSender],
        { onError },
      );

      await expect(
        fallbackSender.send(mockEmailRecipient, "Hello"),
      ).resolves.not.toThrow();

      expect(failingEmailSender.send).toHaveBeenCalledWith(
        mockEmailRecipient,
        "Hello",
      );
      expect(workingEmailSender.send).toHaveBeenCalledWith(
        mockEmailRecipient,
        "Hello",
      );
    });

    it("should fail if all matching senders fail", async () => {
      const failingEmailSender1 = createMockSender("email", true);
      const failingEmailSender2 = createMockSender("email", true);

      const fallbackSender = createFallbackSender(
        [failingEmailSender1, failingEmailSender2],
        { onError },
      );

      await expect(
        fallbackSender.send(mockEmailRecipient, "Hello"),
      ).rejects.toThrow(
        "Не удалось отправить сообщение ни одним из доступных сендеров",
      );

      expect(onError).toHaveBeenCalledTimes(2);
    });

    it("should call onError when a sender fails", async () => {
      const failingEmailSender = createMockSender("email", true);
      const fallbackSender = createFallbackSender([failingEmailSender], {
        onError,
      });

      await fallbackSender.send(mockEmailRecipient, "Hello").catch(() => {});

      expect(onError).toHaveBeenCalled();

      const calls = (onError as ReturnType<typeof vi.fn>).mock.calls;

      const [attempt, error] = calls[0];

      expect(attempt.recipient).toEqual(mockEmailRecipient);
      expect(attempt.message).toBe("Hello");
      expect(error.message).toContain(
        "Ошибка отправки уведомления через канал",
      );
      expect(error.cause?.message).toBe("Ошибка отправки через email");
    });

    it("should throw if all senders fail", async () => {
      const failingEmailSender = createMockSender("email", true);
      const failingBitrixSender = createMockSender("bitrix", true);

      const fallbackSender = createFallbackSender(
        [failingEmailSender, failingBitrixSender],
        { onError },
      );

      await expect(
        fallbackSender.send(mockEmailRecipient, "Hello"),
      ).rejects.toThrow(
        "Не удалось отправить сообщение ни одним из доступных сендеров",
      );

      expect(onError).toHaveBeenCalledTimes(1);
    });

    it("should use first matching sender even if others also match", async () => {
      const emailSender1 = createMockSender("email");
      const emailSender2 = createMockSender("email");

      const fallbackSender = createFallbackSender(
        [emailSender1, emailSender2],
        { onError },
      );

      await fallbackSender.send(mockEmailRecipient, "Hello");

      expect(emailSender1.send).toHaveBeenCalled();
      expect(emailSender2.send).not.toHaveBeenCalled();
    });
  });

  describe("checkHealth", () => {
    it("should return void if any sender's health check succeeds", async () => {
      const healthySender = {
        isSupports: vi.fn(),
        send: vi.fn(),
        checkHealth: vi.fn().mockResolvedValue(undefined),
      };

      const fallbackSender = createFallbackSender([healthySender]);

      await expect(fallbackSender.checkHealth!()).resolves.not.toThrow();
      await expect(fallbackSender.checkHealth!()).resolves.toBeUndefined();
    });

    it("should try next sender if current checkHealth fails", async () => {
      const failingCheckHealth = {
        isSupports: vi.fn(),
        send: vi.fn(),
        checkHealth: vi.fn().mockRejectedValue(new Error("Unhealthy")),
      };

      const healthyCheckHealth = {
        isSupports: vi.fn(),
        send: vi.fn(),
        checkHealth: vi.fn().mockResolvedValue(undefined),
      };

      const fallbackSender = createFallbackSender([
        failingCheckHealth,
        healthyCheckHealth,
      ]);

      await expect(fallbackSender.checkHealth!()).resolves.toBeUndefined();

      expect(failingCheckHealth.checkHealth).toHaveBeenCalled();
      expect(healthyCheckHealth.checkHealth).toHaveBeenCalled();
    });

    it("should reject if no senders have checkHealth method", async () => {
      const senderWithoutCheckHealth = {
        isSupports: vi.fn(),
        send: vi.fn(),
      };

      const fallbackSender = createFallbackSender([
        senderWithoutCheckHealth,
        senderWithoutCheckHealth,
      ]);

      await expect(fallbackSender.checkHealth!()).rejects.toThrow(
        "Ни один из сендров не готов к работе",
      );
    });

    it("should reject if all checkHealth methods fail", async () => {
      const failingCheckHealth1 = {
        isSupports: vi.fn(),
        send: vi.fn(),
        checkHealth: vi.fn().mockRejectedValue(new Error("Error 1")),
      };

      const failingCheckHealth2 = {
        isSupports: vi.fn(),
        send: vi.fn(),
        checkHealth: vi.fn().mockRejectedValue(new Error("Error 2")),
      };

      const fallbackSender = createFallbackSender([
        failingCheckHealth1,
        failingCheckHealth2,
      ]);

      await expect(fallbackSender.checkHealth!()).rejects.toThrow(
        "Ни один из сендров не готов к работе",
      );

      expect(failingCheckHealth1.checkHealth).toHaveBeenCalled();
      expect(failingCheckHealth2.checkHealth).toHaveBeenCalled();
    });
  });
});
