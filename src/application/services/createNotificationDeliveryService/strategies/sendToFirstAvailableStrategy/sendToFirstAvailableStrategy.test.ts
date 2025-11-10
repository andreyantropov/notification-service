import { describe, it, expect } from "vitest";

import { sendToFirstAvailableStrategy } from "./sendToFirstAvailableStrategy.js";
import { Channel } from "../../../../../domain/ports/Channel.js";
import { Contact } from "../../../../../domain/types/Contact.js";
import { Notification } from "../../../../../domain/types/Notification.js";

class MockEmailChannel implements Channel {
  readonly type = "email";

  constructor(
    public isHealthy = true,
    public supports = true,
  ) { }

  isSupports(contact: Contact): boolean {
    return this.supports && contact.type === "email";
  }

  async send(contact: Contact): Promise<void> {
    if (!this.isHealthy) {
      throw new Error("Email service is down");
    }
    if (contact.type !== "email") {
      throw new Error("Invalid contact type for email");
    }
  }
}

class MockBitrixChannel implements Channel {
  readonly type = "bitrix";

  constructor(
    public isHealthy = true,
    public supports = true,
  ) { }

  isSupports(contact: Contact): boolean {
    return this.supports && contact.type === "bitrix";
  }

  async send(contact: Contact): Promise<void> {
    if (!this.isHealthy) {
      throw new Error("Bitrix API error");
    }
    if (contact.type !== "bitrix") {
      throw new Error("Invalid contact type for bitrix");
    }
  }
}

describe("sendToFirstAvailableStrategy", () => {
  const message = "Test notification";

  const emailContact: Contact = {
    type: "email",
    value: "test@example.com",
  };
  const bitrixContact: Contact = { type: "bitrix", value: 123 };

  it("should return error if no contacts are provided", async () => {
    const channels: Channel[] = [new MockEmailChannel()];
    const notification = { id: "1", createdAt: "2025-01-01T00:00:00.000Z", contacts: [], message };

    const result = await sendToFirstAvailableStrategy(notification, channels);

    expect(result.success).toBe(false);
    expect(result.notification).toBe(notification);
    expect(result.error).toBeInstanceOf(Error);
    expect((result.error as Error).message).toBe(
      "Нет получателя или сообщение пустое",
    );
  });

  it("should return error if message is empty", async () => {
    const channels: Channel[] = [new MockEmailChannel(true, true)];
    const notification: Notification = {
      id: "1",
      createdAt: "2025-01-01T00:00:00.000Z",
      contacts: [{ type: "email", value: "test@example.com" }],
      message: "",
    };

    const result = await sendToFirstAvailableStrategy(notification, channels);

    expect(result.success).toBe(false);
    expect(result.notification).toBe(notification);
    expect(result.error).toBeInstanceOf(Error);
    expect((result.error as Error).message).toBe(
      "Нет получателя или сообщение пустое",
    );
    expect(result.warnings).toBeUndefined();
  });

  it("should send to the first contact using a supported channel successfully", async () => {
    const emailChannel = new MockEmailChannel(true, true);
    const channels: Channel[] = [emailChannel];
    const notification: Notification = {
      id: "1",
      createdAt: "2025-01-01T00:00:00.000Z",
      contacts: [emailContact],
      message,
    };

    const result = await sendToFirstAvailableStrategy(notification, channels);

    expect(result.success).toBe(true);
    expect(result.notification).toBe(notification);
    expect(result.warnings).toEqual([]);
    expect(result.details).toEqual({
      contact: emailContact,
      channel: "email",
    });
  });

  it("should skip unsupported channels and use the next available one", async () => {
    const unsupportedEmailChannel = new MockEmailChannel(true, false);
    const bitrixChannel = new MockBitrixChannel(true, true);
    const channels: Channel[] = [unsupportedEmailChannel, bitrixChannel];
    const notification: Notification = {
      id: "1",
      createdAt: "2025-01-01T00:00:00.000Z",
      contacts: [bitrixContact],
      message,
    };

    const result = await sendToFirstAvailableStrategy(notification, channels);

    expect(result.success).toBe(true);
    expect(result.notification).toBe(notification);
    expect(result.warnings).toEqual([]);
    expect(result.details).toEqual({
      contact: bitrixContact,
      channel: "bitrix",
    });
  });

  it("should return warnings when no channels are available for a contact", async () => {
    const channels: Channel[] = [];
    const notification: Notification = {
      id: "1",
      createdAt: "2025-01-01T00:00:00.000Z",
      contacts: [emailContact],
      message,
    };

    const result = await sendToFirstAvailableStrategy(notification, channels);

    expect(result.success).toBe(false);
    expect(result.notification).toBe(notification);
    expect(result.warnings).toHaveLength(1);
    expect(result.warnings![0]).toEqual({
      message: `Для адресата ${JSON.stringify(emailContact)} не указано ни одного доступного канала`,
      contact: emailContact,
    });
    expect(result.error).toBeInstanceOf(Error);
    expect((result.error as Error).message).toBe(
      "Не удалось отправить уведомление ни одним из доступных способов",
    );
  });

  it("should try next contact if first one fails all channels", async () => {
    const failingEmailChannel = new MockEmailChannel(false, true);
    const workingBitrixChannel = new MockBitrixChannel(true, true);
    const channels: Channel[] = [failingEmailChannel, workingBitrixChannel];
    const notification: Notification = {
      id: "1",
      createdAt: "2025-01-01T00:00:00.000Z",
      contacts: [emailContact, bitrixContact],
      message,
    };

    const result = await sendToFirstAvailableStrategy(notification, channels);

    expect(result.success).toBe(true);
    expect(result.notification).toBe(notification);
    expect(result.warnings).toHaveLength(1);
    expect(result.warnings![0]).toEqual({
      message: "Ошибка отправки через канал email",
      details: expect.any(Error),
      contact: emailContact,
      channel: "email",
    });
    expect(result.details).toEqual({
      contact: bitrixContact,
      channel: "bitrix",
    });
  });

  it("should return failure if no contact can be delivered to", async () => {
    const failingEmailChannel = new MockEmailChannel(false, true);
    const failingBitrixChannel = new MockBitrixChannel(false, true);
    const channels: Channel[] = [failingEmailChannel, failingBitrixChannel];
    const notification: Notification = {
      id: "1",
      createdAt: "2025-01-01T00:00:00.000Z",
      contacts: [emailContact, bitrixContact],
      message,
    };

    const result = await sendToFirstAvailableStrategy(notification, channels);

    expect(result.success).toBe(false);
    expect(result.notification).toBe(notification);
    expect(result.warnings).toHaveLength(2);
    expect(result.warnings![0]).toEqual({
      message: "Ошибка отправки через канал email",
      details: expect.any(Error),
      contact: emailContact,
      channel: "email",
    });
    expect(result.warnings![1]).toEqual({
      message: "Ошибка отправки через канал bitrix",
      details: expect.any(Error),
      contact: bitrixContact,
      channel: "bitrix",
    });
    expect(result.error).toBeInstanceOf(Error);
    expect((result.error as Error).message).toBe(
      "Не удалось отправить уведомление ни одним из доступных способов",
    );
  });

  it("should stop after first successful delivery", async () => {
    const successfulChannel = new MockEmailChannel(true, true);
    const channels: Channel[] = [successfulChannel];
    const notification: Notification = {
      id: "1",
      createdAt: "2025-01-01T00:00:00.000Z",
      contacts: [emailContact, bitrixContact],
      message,
    };

    const result = await sendToFirstAvailableStrategy(notification, channels);

    expect(result.success).toBe(true);
    expect(result.notification).toBe(notification);
    expect(result.warnings).toEqual([]);
    expect(result.details).toEqual({
      contact: emailContact,
      channel: "email",
    });
  });

  it("should handle mixed contact types and find correct channel", async () => {
    const emailChannel = new MockEmailChannel(true, true);
    const bitrixChannel = new MockBitrixChannel(true, true);
    const channels: Channel[] = [bitrixChannel, emailChannel];
    const notification: Notification = {
      id: "1",
      createdAt: "2025-01-01T00:00:00.000Z",
      contacts: [bitrixContact, emailContact],
      message,
    };

    const result = await sendToFirstAvailableStrategy(notification, channels);

    expect(result.success).toBe(true);
    expect(result.notification).toBe(notification);
    expect(result.warnings).toEqual([]);
    expect(result.details).toEqual({
      contact: bitrixContact,
      channel: "bitrix",
    });
  });

  it("should include warnings when channel throws", async () => {
    const failingChannel = new MockEmailChannel(false, true);
    const channels: Channel[] = [failingChannel];
    const notification: Notification = {
      id: "1",
      createdAt: "2025-01-01T00:00:00.000Z",
      contacts: [emailContact],
      message,
    };

    const result = await sendToFirstAvailableStrategy(notification, channels);

    expect(result.success).toBe(false);
    expect(result.notification).toBe(notification);
    expect(result.warnings).toHaveLength(1);
    expect(result.warnings![0]).toEqual({
      message: "Ошибка отправки через канал email",
      details: expect.any(Error),
      contact: emailContact,
      channel: "email",
    });
    expect(result.error).toBeInstanceOf(Error);
    expect((result.error as Error).message).toBe(
      "Не удалось отправить уведомление ни одним из доступных способов",
    );
  });
});
