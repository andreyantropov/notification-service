import { describe, it, expect } from "vitest";

import { sendToFirstAvailableStrategy } from "./sendToFirstAvailableStrategy.js";
import { CHANNEL_TYPES } from "@notification-platform/shared";
import type { Channel } from "../../../../../domain/ports/index.js";
import type {
  Contact,
  Notification,
} from "@notification-platform/shared";

class MockEmailChannel implements Channel {
  readonly type = CHANNEL_TYPES.EMAIL;

  constructor(
    public isHealthy = true,
    public supports = true,
  ) { }

  isSupports(contact: Contact): boolean {
    return this.supports && contact.type === CHANNEL_TYPES.EMAIL;
  }

  async send(contact: Contact): Promise<void> {
    if (!this.isHealthy) {
      throw new Error("Email service is down");
    }
    if (contact.type !== CHANNEL_TYPES.EMAIL) {
      throw new Error("Invalid contact type for email");
    }
  }
}

class MockBitrixChannel implements Channel {
  readonly type = CHANNEL_TYPES.BITRIX;

  constructor(
    public isHealthy = true,
    public supports = true,
  ) { }

  isSupports(contact: Contact): boolean {
    return this.supports && contact.type === CHANNEL_TYPES.BITRIX;
  }

  async send(contact: Contact): Promise<void> {
    if (!this.isHealthy) {
      throw new Error("Bitrix API error");
    }
    if (contact.type !== CHANNEL_TYPES.BITRIX) {
      throw new Error("Invalid contact type for bitrix");
    }
  }
}

describe("sendToFirstAvailableStrategy", () => {
  const message = "Test notification";

  const emailContact: Contact = {
    type: CHANNEL_TYPES.EMAIL,
    value: "test@example.com",
  };
  const bitrixContact: Contact = { type: CHANNEL_TYPES.BITRIX, value: 123 };

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

    expect(result.status).toBe("success");
    expect(result.notification).toBe(notification);
    expect(result.warnings).toEqual([]);
    expect(result.details).toEqual({
      contact: emailContact,
      channel: CHANNEL_TYPES.EMAIL,
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

    expect(result.status).toBe("success");
    expect(result.notification).toBe(notification);
    expect(result.warnings).toEqual([]);
    expect(result.details).toEqual({
      contact: bitrixContact,
      channel: CHANNEL_TYPES.BITRIX,
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

    expect(result.status).toBe("failure");
    expect(result.notification).toBe(notification);
    expect(result.warnings).toHaveLength(1);
    expect(result.warnings![0]).toEqual({
      message: `Для адресата ${JSON.stringify(emailContact)} не указано ни одного доступного канала`,
      contact: emailContact.type,
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

    expect(result.status).toBe("success");
    expect(result.notification).toBe(notification);
    expect(result.warnings).toHaveLength(1);
    expect(result.warnings![0]).toEqual({
      message: "Ошибка отправки через канал email",
      details: expect.any(Error),
      contact: emailContact.type,
      channel: CHANNEL_TYPES.EMAIL,
    });
    expect(result.details).toEqual({
      contact: bitrixContact,
      channel: CHANNEL_TYPES.BITRIX,
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

    expect(result.status).toBe("failure");
    expect(result.notification).toBe(notification);
    expect(result.warnings).toHaveLength(2);
    expect(result.warnings![0]).toEqual({
      message: "Ошибка отправки через канал email",
      details: expect.any(Error),
      contact: emailContact.type,
      channel: CHANNEL_TYPES.EMAIL,
    });
    expect(result.warnings![1]).toEqual({
      message: "Ошибка отправки через канал bitrix",
      details: expect.any(Error),
      contact: bitrixContact.type,
      channel: CHANNEL_TYPES.BITRIX,
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

    expect(result.status).toBe("success");
    expect(result.notification).toBe(notification);
    expect(result.warnings).toEqual([]);
    expect(result.details).toEqual({
      contact: emailContact,
      channel: CHANNEL_TYPES.EMAIL,
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

    expect(result.status).toBe("success");
    expect(result.notification).toBe(notification);
    expect(result.warnings).toEqual([]);
    expect(result.details).toEqual({
      contact: bitrixContact,
      channel: CHANNEL_TYPES.BITRIX,
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

    expect(result.status).toBe("failure");
    expect(result.notification).toBe(notification);
    expect(result.warnings).toHaveLength(1);
    expect(result.warnings![0]).toEqual({
      message: "Ошибка отправки через канал email",
      details: expect.any(Error),
      contact: emailContact.type,
      channel: CHANNEL_TYPES.EMAIL,
    });
    expect(result.error).toBeInstanceOf(Error);
    expect((result.error as Error).message).toBe(
      "Не удалось отправить уведомление ни одним из доступных способов",
    );
  });
});
