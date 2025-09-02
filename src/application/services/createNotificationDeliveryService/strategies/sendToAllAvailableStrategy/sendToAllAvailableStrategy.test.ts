import { describe, it, expect, vi, beforeEach } from "vitest";
import { sendToAllAvailableStrategy } from "./sendToAllAvailableStrategy";
import { Sender } from "../../../../../domain/ports/Sender.js";
import { Recipient } from "../../../../../domain/types/Recipient.js";
import { Notification } from "../../../../../domain/types/Notification.js";

const createMockSender = (
  isSupports: (recipient: Recipient) => boolean,
  sendImpl: (recipient: Recipient, message: string) => Promise<void>,
) => {
  const sender: Sender = {
    isSupports,
    send: vi.fn(sendImpl),
  };
  return sender;
};

const emailRecipient: Recipient = { type: "email", value: "test@example.com" };
const bitrixRecipient: Recipient = { type: "bitrix", value: 123 };
const message = "Test notification";

describe("sendToAllAvailableStrategy", () => {
  let onError: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    onError = vi.fn();
  });

  it("should throw if no recipients are provided", async () => {
    const senders = [
      createMockSender(
        () => true,
        async () => {},
      ),
    ];

    const notification = { recipients: [], message };

    await expect(
      sendToAllAvailableStrategy(senders, notification, onError),
    ).rejects.toThrow("Нет получателя для доставки уведомления");

    expect(onError).not.toHaveBeenCalled();
  });

  it("should send to all recipients with supported senders successfully", async () => {
    const sendSpy = vi.fn().mockResolvedValue(undefined);

    const emailSender = createMockSender((r) => r.type === "email", sendSpy);

    const notification: Notification = {
      recipients: [emailRecipient],
      message,
    };

    await expect(
      sendToAllAvailableStrategy([emailSender], notification, onError),
    ).resolves.not.toThrow();

    expect(sendSpy).toHaveBeenCalledWith(emailRecipient, message);
    expect(onError).not.toHaveBeenCalled();
  });

  it("should handle multiple recipients with different supported senders", async () => {
    const emailSendSpy = vi.fn().mockResolvedValue(undefined);
    const bitrixSendSpy = vi.fn().mockResolvedValue(undefined);

    const emailSender = createMockSender(
      (r) => r.type === "email",
      emailSendSpy,
    );

    const bitrixSender = createMockSender(
      (r) => r.type === "bitrix",
      bitrixSendSpy,
    );

    const notification: Notification = {
      recipients: [emailRecipient, bitrixRecipient],
      message,
    };

    await expect(
      sendToAllAvailableStrategy(
        [emailSender, bitrixSender],
        notification,
        onError,
      ),
    ).resolves.not.toThrow();

    expect(emailSendSpy).toHaveBeenCalledWith(emailRecipient, message);
    expect(bitrixSendSpy).toHaveBeenCalledWith(bitrixRecipient, message);
    expect(onError).not.toHaveBeenCalled();
  });

  it("should call onError for recipient with no senders available", async () => {
    const emptySenders: Sender[] = [];
    const notification: Notification = {
      recipients: [emailRecipient],
      message,
    };

    await expect(
      sendToAllAvailableStrategy(emptySenders, notification, onError),
    ).rejects.toThrow(
      "Не удалось отправить уведомление ни одним из доступных способов",
    );

    expect(onError).toHaveBeenCalledWith(
      { recipient: emailRecipient, message },
      expect.any(Error),
    );
    expect(onError.mock.calls[0][1].message).toContain(
      "не указано ни одного доступного канала",
    );
  });

  it("should call onError when sender fails to send, but succeed if at least one recipient is delivered", async () => {
    const workingSendSpy = vi.fn().mockResolvedValue(undefined);
    const failingSendSpy = vi
      .fn()
      .mockRejectedValue(new Error("Network error"));

    const workingSender = createMockSender(
      (r) => r.type === "email",
      workingSendSpy,
    );

    const failingSender = createMockSender(
      (r) => r.type === "bitrix",
      failingSendSpy,
    );

    const notification: Notification = {
      recipients: [emailRecipient, bitrixRecipient],
      message,
    };

    await expect(
      sendToAllAvailableStrategy(
        [workingSender, failingSender],
        notification,
        onError,
      ),
    ).resolves.not.toThrow();

    expect(workingSendSpy).toHaveBeenCalledWith(emailRecipient, message);
    expect(failingSendSpy).toHaveBeenCalledWith(bitrixRecipient, message);

    expect(onError).toHaveBeenCalledWith(
      { recipient: bitrixRecipient, message },
      expect.objectContaining({
        message: expect.stringContaining(
          "Ошибка отправки уведомления через канал Object",
        ),
      }),
    );
  });

  it("should throw if all recipients fail to deliver", async () => {
    const failingEmailSend = vi.fn().mockRejectedValue(new Error("SMTP error"));
    const failingBitrixSend = vi
      .fn()
      .mockRejectedValue(new Error("Bitrix API error"));

    const emailSender = createMockSender(
      (r) => r.type === "email",
      failingEmailSend,
    );

    const bitrixSender = createMockSender(
      (r) => r.type === "bitrix",
      failingBitrixSend,
    );

    const notification: Notification = {
      recipients: [emailRecipient, bitrixRecipient],
      message,
    };

    await expect(
      sendToAllAvailableStrategy(
        [emailSender, bitrixSender],
        notification,
        onError,
      ),
    ).rejects.toThrow(
      "Не удалось отправить уведомление ни одним из доступных способов",
    );

    expect(onError).toHaveBeenCalledWith(
      { recipient: emailRecipient, message },
      expect.objectContaining({
        message: expect.stringContaining(
          "Ошибка отправки уведомления через канал Object",
        ),
      }),
    );
    expect(onError).toHaveBeenCalledWith(
      { recipient: bitrixRecipient, message },
      expect.objectContaining({
        message: expect.stringContaining(
          "Ошибка отправки уведомления через канал Object",
        ),
      }),
    );

    expect(onError).toHaveBeenCalledWith(
      { recipient: emailRecipient, message },
      expect.objectContaining({
        message: expect.stringContaining(
          "Не удалось доставить уведомление адресату",
        ),
      }),
    );
    expect(onError).toHaveBeenCalledWith(
      { recipient: bitrixRecipient, message },
      expect.objectContaining({
        message: expect.stringContaining(
          "Не удалось доставить уведомление адресату",
        ),
      }),
    );

    expect(onError).toHaveBeenCalledTimes(4);
  });

  it("should not throw if at least one recipient is successfully delivered", async () => {
    const successfulSend = vi.fn().mockResolvedValue(undefined);
    const failingSend = vi.fn().mockRejectedValue(new Error("Failed"));

    const senderForEmail = createMockSender(
      (r) => r.type === "email",
      successfulSend,
    );

    const senderForBitrix = createMockSender(
      (r) => r.type === "bitrix",
      failingSend,
    );

    const notification: Notification = {
      recipients: [emailRecipient, bitrixRecipient],
      message,
    };

    await expect(
      sendToAllAvailableStrategy(
        [senderForEmail, senderForBitrix],
        notification,
        onError,
      ),
    ).resolves.not.toThrow();

    expect(successfulSend).toHaveBeenCalledWith(emailRecipient, message);
    expect(failingSend).toHaveBeenCalledWith(bitrixRecipient, message);

    expect(onError).toHaveBeenCalledWith(
      { recipient: bitrixRecipient, message },
      expect.objectContaining({
        message: expect.stringContaining(
          "Ошибка отправки уведомления через канал Object",
        ),
      }),
    );
    expect(onError).toHaveBeenCalledWith(
      { recipient: bitrixRecipient, message },
      expect.objectContaining({
        message: expect.stringContaining(
          "Не удалось доставить уведомление адресату",
        ),
      }),
    );
  });

  it("should call onError with cause when sender throws", async () => {
    const originalError = new Error("Service unavailable");
    const failingSend = vi.fn().mockRejectedValue(originalError);

    const sender = createMockSender((r) => r.type === "email", failingSend);

    const notification: Notification = {
      recipients: [emailRecipient],
      message,
    };

    await expect(
      sendToAllAvailableStrategy([sender], notification, onError),
    ).rejects.toThrow(
      "Не удалось отправить уведомление ни одним из доступных способов",
    );

    const errorCall = onError.mock.calls.find(
      ([payload]) => payload.recipient === emailRecipient,
    );
    expect(errorCall).toBeDefined();

    const error = errorCall![1];
    expect(error).toBeInstanceOf(Error);
    expect(error.message).toContain(
      "Ошибка отправки уведомления через канал Object",
    );
    expect(error.cause).toBe(originalError);
  });
});
