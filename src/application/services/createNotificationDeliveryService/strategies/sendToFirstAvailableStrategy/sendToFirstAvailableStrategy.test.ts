import { describe, it, expect } from "vitest";

import { sendToFirstAvailableStrategy } from "./sendToFirstAvailableStrategy.js";
import { Sender } from "../../../../../domain/ports/Sender.js";
import { Notification } from "../../../../../domain/types/Notification.js";
import { Recipient } from "../../../../../domain/types/Recipient.js";

class MockEmailSender implements Sender {
  constructor(
    public isHealthy = true,
    public supports = true,
  ) {}

  isSupports(recipient: Recipient): boolean {
    return this.supports && recipient.type === "email";
  }

  async send(recipient: Recipient): Promise<void> {
    if (!this.isHealthy) {
      throw new Error("Email service is down");
    }
    if (recipient.type !== "email") {
      throw new Error("Invalid recipient type for email");
    }
  }
}

class MockBitrixSender implements Sender {
  constructor(
    public isHealthy = true,
    public supports = true,
  ) {}

  isSupports(recipient: Recipient): boolean {
    return this.supports && recipient.type === "bitrix";
  }

  async send(recipient: Recipient): Promise<void> {
    if (!this.isHealthy) {
      throw new Error("Bitrix API error");
    }
    if (recipient.type !== "bitrix") {
      throw new Error("Invalid recipient type for bitrix");
    }
  }
}

describe("sendToFirstAvailableStrategy", () => {
  const message = "Test notification";

  const emailRecipient: Recipient = {
    type: "email",
    value: "test@example.com",
  };
  const bitrixRecipient: Recipient = { type: "bitrix", value: 123 };

  it("should return error if no recipients are provided", async () => {
    const senders: Sender[] = [new MockEmailSender()];
    const notification = { recipients: [], message };

    const result = await sendToFirstAvailableStrategy(notification, senders);

    expect(result.success).toBe(false);
    expect(result.notification).toBe(notification);
    expect(result.error).toBeInstanceOf(Error);
    expect((result.error as Error).message).toBe(
      "Нет получателя или сообщение пустое",
    );
  });

  it("should return error if message is empty", async () => {
    const senders: Sender[] = [new MockEmailSender(true, true)];
    const notification: Notification = {
      recipients: [{ type: "email", value: "test@example.com" }],
      message: "",
    };

    const result = await sendToFirstAvailableStrategy(notification, senders);

    expect(result.success).toBe(false);
    expect(result.notification).toBe(notification);
    expect(result.error).toBeInstanceOf(Error);
    expect((result.error as Error).message).toBe(
      "Нет получателя или сообщение пустое",
    );
    expect(result.warnings).toBeUndefined();
  });

  it("should send to the first recipient using a supported sender successfully", async () => {
    const emailSender = new MockEmailSender(true, true);
    const senders: Sender[] = [emailSender];
    const notification: Notification = {
      recipients: [emailRecipient],
      message,
    };

    const result = await sendToFirstAvailableStrategy(notification, senders);

    expect(result.success).toBe(true);
    expect(result.notification).toBe(notification);
    expect(result.warnings).toEqual([]);
    expect(result.details).toEqual({
      recipient: emailRecipient,
      sender: "MockEmailSender",
    });
  });

  it("should skip unsupported senders and use the next available one", async () => {
    const unsupportedEmailSender = new MockEmailSender(true, false);
    const bitrixSender = new MockBitrixSender(true, true);
    const senders: Sender[] = [unsupportedEmailSender, bitrixSender];
    const notification: Notification = {
      recipients: [bitrixRecipient],
      message,
    };

    const result = await sendToFirstAvailableStrategy(notification, senders);

    expect(result.success).toBe(true);
    expect(result.notification).toBe(notification);
    expect(result.warnings).toEqual([]);
    expect(result.details).toEqual({
      recipient: bitrixRecipient,
      sender: "MockBitrixSender",
    });
  });

  it("should return warnings when no senders are available for a recipient", async () => {
    const senders: Sender[] = [];
    const notification: Notification = {
      recipients: [emailRecipient],
      message,
    };

    const result = await sendToFirstAvailableStrategy(notification, senders);

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

  it("should try next recipient if first one fails all senders", async () => {
    const failingEmailSender = new MockEmailSender(false, true);
    const workingBitrixSender = new MockBitrixSender(true, true);
    const senders: Sender[] = [failingEmailSender, workingBitrixSender];
    const notification: Notification = {
      recipients: [emailRecipient, bitrixRecipient],
      message,
    };

    const result = await sendToFirstAvailableStrategy(notification, senders);

    expect(result.success).toBe(true);
    expect(result.notification).toBe(notification);
    expect(result.warnings).toHaveLength(1);
    expect(result.warnings![0]).toEqual({
      message: "Ошибка отправки через канал MockEmailSender",
      details: expect.any(Error),
      recipient: emailRecipient,
      sender: "MockEmailSender",
    });
    expect(result.details).toEqual({
      recipient: bitrixRecipient,
      sender: "MockBitrixSender",
    });
  });

  it("should return failure if no recipient can be delivered to", async () => {
    const failingEmailSender = new MockEmailSender(false, true);
    const failingBitrixSender = new MockBitrixSender(false, true);
    const senders: Sender[] = [failingEmailSender, failingBitrixSender];
    const notification: Notification = {
      recipients: [emailRecipient, bitrixRecipient],
      message,
    };

    const result = await sendToFirstAvailableStrategy(notification, senders);

    expect(result.success).toBe(false);
    expect(result.notification).toBe(notification);
    expect(result.warnings).toHaveLength(2);
    expect(result.warnings![0]).toEqual({
      message: "Ошибка отправки через канал MockEmailSender",
      details: expect.any(Error),
      recipient: emailRecipient,
      sender: "MockEmailSender",
    });
    expect(result.warnings![1]).toEqual({
      message: "Ошибка отправки через канал MockBitrixSender",
      details: expect.any(Error),
      recipient: bitrixRecipient,
      sender: "MockBitrixSender",
    });
    expect(result.error).toBeInstanceOf(Error);
    expect((result.error as Error).message).toBe(
      "Не удалось отправить уведомление ни одним из доступных способов",
    );
  });

  it("should stop after first successful delivery", async () => {
    const successfulSender = new MockEmailSender(true, true);
    const senders: Sender[] = [successfulSender];
    const notification: Notification = {
      recipients: [emailRecipient, bitrixRecipient],
      message,
    };

    const result = await sendToFirstAvailableStrategy(notification, senders);

    expect(result.success).toBe(true);
    expect(result.notification).toBe(notification);
    expect(result.warnings).toEqual([]);
    expect(result.details).toEqual({
      recipient: emailRecipient,
      sender: "MockEmailSender",
    });
  });

  it("should handle mixed recipient types and find correct sender", async () => {
    const emailSender = new MockEmailSender(true, true);
    const bitrixSender = new MockBitrixSender(true, true);
    const senders: Sender[] = [bitrixSender, emailSender];
    const notification: Notification = {
      recipients: [bitrixRecipient, emailRecipient],
      message,
    };

    const result = await sendToFirstAvailableStrategy(notification, senders);

    expect(result.success).toBe(true);
    expect(result.notification).toBe(notification);
    expect(result.warnings).toEqual([]);
    expect(result.details).toEqual({
      recipient: bitrixRecipient,
      sender: "MockBitrixSender",
    });
  });

  it("should include warnings when sender throws", async () => {
    const failingSender = new MockEmailSender(false, true);
    const senders: Sender[] = [failingSender];
    const notification: Notification = {
      recipients: [emailRecipient],
      message,
    };

    const result = await sendToFirstAvailableStrategy(notification, senders);

    expect(result.success).toBe(false);
    expect(result.notification).toBe(notification);
    expect(result.warnings).toHaveLength(1);
    expect(result.warnings![0]).toEqual({
      message: "Ошибка отправки через канал MockEmailSender",
      details: expect.any(Error),
      recipient: emailRecipient,
      sender: "MockEmailSender",
    });
    expect(result.error).toBeInstanceOf(Error);
    expect((result.error as Error).message).toBe(
      "Не удалось отправить уведомление ни одним из доступных способов",
    );
  });
});
