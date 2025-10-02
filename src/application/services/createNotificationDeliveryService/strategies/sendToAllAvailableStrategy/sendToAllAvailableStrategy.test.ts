import { describe, it, expect, vi } from "vitest";

import { sendToAllAvailableStrategy } from "./sendToAllAvailableStrategy.js";
import { Sender } from "../../../../../domain/ports/Sender.js";
import { Notification } from "../../../../../domain/types/Notification.js";
import { Recipient } from "../../../../../domain/types/Recipient.js";

const createMockSender = (
  type: Sender["type"],
  isSupports: (recipient: Recipient) => boolean,
  sendImpl: (recipient: Recipient, message: string) => Promise<void>,
): Sender => {
  return {
    type,
    isSupports,
    send: vi.fn(sendImpl),
  };
};

const emailRecipient: Recipient = { type: "email", value: "test@example.com" };
const bitrixRecipient: Recipient = { type: "bitrix", value: 123 };
const message = "Test notification";

describe("sendToAllAvailableStrategy", () => {
  it("should return error if no recipients are provided", async () => {
    const senders = [
      createMockSender(
        "email",
        () => true,
        async () => {},
      ),
    ];

    const notification = { recipients: [], message };

    const result = await sendToAllAvailableStrategy(notification, senders);

    expect(result.success).toBe(false);
    expect(result.notification).toBe(notification);
    expect(result.error).toBeInstanceOf(Error);
    expect((result.error as Error).message).toBe(
      "Нет получателя или сообщение пустое",
    );
  });

  it("should return error if message is empty", async () => {
    const senders = [
      createMockSender(
        "email",
        () => true,
        async () => {},
      ),
    ];

    const notification: Notification = {
      recipients: [emailRecipient],
      message: "",
    };

    const result = await sendToAllAvailableStrategy(notification, senders);

    expect(result.success).toBe(false);
    expect(result.notification).toBe(notification);
    expect(result.error).toBeInstanceOf(Error);
    expect((result.error as Error).message).toBe(
      "Нет получателя или сообщение пустое",
    );
  });

  it("should send to all recipients with supported senders successfully", async () => {
    const sendSpy = vi.fn().mockResolvedValue(undefined);

    const emailSender = createMockSender(
      "email",
      (r) => r.type === "email",
      sendSpy,
    );

    const notification: Notification = {
      recipients: [emailRecipient],
      message,
    };

    const result = await sendToAllAvailableStrategy(notification, [
      emailSender,
    ]);

    expect(result.success).toBe(true);
    expect(result.notification).toBe(notification);
    expect(result.warnings).toEqual([]);
    expect(result.details).toEqual([
      {
        recipient: emailRecipient,
        sender: "email",
      },
    ]);
    expect(sendSpy).toHaveBeenCalledWith(emailRecipient, message);
  });

  it("should handle multiple recipients with different supported senders", async () => {
    const emailSendSpy = vi.fn().mockResolvedValue(undefined);
    const bitrixSendSpy = vi.fn().mockResolvedValue(undefined);

    const emailSender = createMockSender(
      "email",
      (r) => r.type === "email",
      emailSendSpy,
    );

    const bitrixSender = createMockSender(
      "bitrix",
      (r) => r.type === "bitrix",
      bitrixSendSpy,
    );

    const notification: Notification = {
      recipients: [emailRecipient, bitrixRecipient],
      message,
    };

    const result = await sendToAllAvailableStrategy(notification, [
      emailSender,
      bitrixSender,
    ]);

    expect(result.success).toBe(true);
    expect(result.notification).toBe(notification);
    expect(result.warnings).toEqual([]);
    expect(result.details).toEqual([
      {
        recipient: emailRecipient,
        sender: "email",
      },
      {
        recipient: bitrixRecipient,
        sender: "bitrix",
      },
    ]);
    expect(emailSendSpy).toHaveBeenCalledWith(emailRecipient, message);
    expect(bitrixSendSpy).toHaveBeenCalledWith(bitrixRecipient, message);
  });

  it("should return warnings for recipient with no senders available", async () => {
    const emptySenders: Sender[] = [];
    const notification: Notification = {
      recipients: [emailRecipient],
      message,
    };

    const result = await sendToAllAvailableStrategy(notification, emptySenders);

    expect(result.success).toBe(false);
    expect(result.notification).toBe(notification);
    expect(result.warnings).toHaveLength(1);
    expect(result.warnings![0]).toEqual({
      message: `Для адресата ${JSON.stringify(emailRecipient)} не указано ни одного доступного канала`,
      recipient: emailRecipient,
    });
    expect(result.error).toBeInstanceOf(Error);
    expect((result.error as Error).message).toBe(
      "Не удалось отправить уведомление ни одним из доступных способов",
    );
  });

  it("should return success if at least one delivery succeeded, even if others failed", async () => {
    const workingSendSpy = vi.fn().mockResolvedValue(undefined);
    const failingSendSpy = vi
      .fn()
      .mockRejectedValue(new Error("Network error"));

    const workingSender = createMockSender(
      "email",
      (r) => r.type === "email",
      workingSendSpy,
    );

    const failingSender = createMockSender(
      "bitrix",
      (r) => r.type === "bitrix",
      failingSendSpy,
    );

    const notification: Notification = {
      recipients: [emailRecipient, bitrixRecipient],
      message,
    };

    const result = await sendToAllAvailableStrategy(notification, [
      workingSender,
      failingSender,
    ]);

    expect(result.success).toBe(true);
    expect(result.notification).toBe(notification);
    expect(result.warnings).toHaveLength(1);
    expect(result.warnings![0]).toEqual({
      message: "Ошибка отправки через канал bitrix",
      details: expect.any(Error),
      recipient: bitrixRecipient,
      sender: "bitrix",
    });
    expect(result.details).toEqual([
      {
        recipient: emailRecipient,
        sender: "email",
      },
    ]);
    expect(workingSendSpy).toHaveBeenCalledWith(emailRecipient, message);
    expect(failingSendSpy).toHaveBeenCalledWith(bitrixRecipient, message);
  });

  it("should return failure if all recipients fail to deliver", async () => {
    const failingEmailSend = vi.fn().mockRejectedValue(new Error("SMTP error"));
    const failingBitrixSend = vi
      .fn()
      .mockRejectedValue(new Error("Bitrix API error"));

    const emailSender = createMockSender(
      "email",
      (r) => r.type === "email",
      failingEmailSend,
    );

    const bitrixSender = createMockSender(
      "bitrix",
      (r) => r.type === "bitrix",
      failingBitrixSend,
    );

    const notification: Notification = {
      recipients: [emailRecipient, bitrixRecipient],
      message,
    };

    const result = await sendToAllAvailableStrategy(notification, [
      emailSender,
      bitrixSender,
    ]);

    expect(result.success).toBe(false);
    expect(result.notification).toBe(notification);
    expect(result.warnings).toHaveLength(2);
    expect(result.warnings![0]).toEqual({
      message: "Ошибка отправки через канал email",
      details: expect.any(Error),
      recipient: emailRecipient,
      sender: "email",
    });
    expect(result.warnings![1]).toEqual({
      message: "Ошибка отправки через канал bitrix",
      details: expect.any(Error),
      recipient: bitrixRecipient,
      sender: "bitrix",
    });
    expect(result.error).toBeInstanceOf(Error);
    expect((result.error as Error).message).toBe(
      "Не удалось отправить уведомление ни одним из доступных способов",
    );
  });

  it("should return success if at least one recipient is successfully delivered", async () => {
    const successfulSend = vi.fn().mockResolvedValue(undefined);
    const failingSend = vi.fn().mockRejectedValue(new Error("Failed"));

    const senderForEmail = createMockSender(
      "email",
      (r) => r.type === "email",
      successfulSend,
    );

    const senderForBitrix = createMockSender(
      "bitrix",
      (r) => r.type === "bitrix",
      failingSend,
    );

    const notification: Notification = {
      recipients: [emailRecipient, bitrixRecipient],
      message,
    };

    const result = await sendToAllAvailableStrategy(notification, [
      senderForEmail,
      senderForBitrix,
    ]);

    expect(result.success).toBe(true);
    expect(result.notification).toBe(notification);
    expect(result.warnings).toHaveLength(1);
    expect(result.warnings![0]).toEqual({
      message: "Ошибка отправки через канал bitrix",
      details: expect.any(Error),
      recipient: bitrixRecipient,
      sender: "bitrix",
    });
    expect(result.details).toEqual([
      {
        recipient: emailRecipient,
        sender: "email",
      },
    ]);
    expect(successfulSend).toHaveBeenCalledWith(emailRecipient, message);
    expect(failingSend).toHaveBeenCalledWith(bitrixRecipient, message);
  });

  it("should include error details when sender throws", async () => {
    const originalError = new Error("Service unavailable");
    const failingSend = vi.fn().mockRejectedValue(originalError);

    const sender = createMockSender(
      "email",
      (r) => r.type === "email",
      failingSend,
    );

    const notification: Notification = {
      recipients: [emailRecipient],
      message,
    };

    const result = await sendToAllAvailableStrategy(notification, [sender]);

    expect(result.success).toBe(false);
    expect(result.notification).toBe(notification);
    expect(result.warnings).toHaveLength(1);
    expect(result.warnings![0]).toEqual({
      message: "Ошибка отправки через канал email",
      details: originalError,
      recipient: emailRecipient,
      sender: "email",
    });
    expect(result.error).toBeInstanceOf(Error);
    expect((result.error as Error).message).toBe(
      "Не удалось отправить уведомление ни одним из доступных способов",
    );
  });
});
