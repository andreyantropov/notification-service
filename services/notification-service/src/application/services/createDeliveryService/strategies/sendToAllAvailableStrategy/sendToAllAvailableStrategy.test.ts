import { describe, it, expect, vi } from "vitest";

import { sendToAllAvailableStrategy } from "./sendToAllAvailableStrategy.js";
import { CHANNEL_TYPES } from "@notification-platform/shared";
import type { Channel } from "../../../../../domain/ports/index.js";
import type {
  Contact,
  Notification,
} from "@notification-platform/shared";

const createMockChannel = (
  type: Channel["type"],
  isSupports: (contact: Contact) => boolean,
  sendImpl: (contact: Contact, message: string) => Promise<void>,
): Channel => {
  return {
    type,
    isSupports,
    send: vi.fn(sendImpl),
  };
};

const emailContact: Contact = {
  type: CHANNEL_TYPES.EMAIL,
  value: "test@example.com",
};
const bitrixContact: Contact = { type: CHANNEL_TYPES.BITRIX, value: 123 };
const message = "Test notification";

describe("sendToAllAvailableStrategy", () => {
  it("should send to all contacts with supported channels successfully", async () => {
    const sendSpy = vi.fn().mockResolvedValue(undefined);

    const emailChannel = createMockChannel(
      CHANNEL_TYPES.EMAIL,
      (r) => r.type === CHANNEL_TYPES.EMAIL,
      sendSpy,
    );

    const notification: Notification = {
      id: "1",
      createdAt: "2025-01-01T00:00:00.000Z",
      contacts: [emailContact],
      message,
    };

    const result = await sendToAllAvailableStrategy(notification, [
      emailChannel,
    ]);

    expect(result.status).toBe("success");
    expect(result.notification).toBe(notification);
    expect(result.warnings).toEqual([]);
    expect(result.details).toEqual([
      {
        contact: emailContact,
        channel: CHANNEL_TYPES.EMAIL,
      },
    ]);
    expect(sendSpy).toHaveBeenCalledWith(emailContact, message);
  });

  it("should handle multiple contacts with different supported channels", async () => {
    const emailSendSpy = vi.fn().mockResolvedValue(undefined);
    const bitrixSendSpy = vi.fn().mockResolvedValue(undefined);

    const emailChannel = createMockChannel(
      CHANNEL_TYPES.EMAIL,
      (r) => r.type === CHANNEL_TYPES.EMAIL,
      emailSendSpy,
    );

    const bitrixChannel = createMockChannel(
      CHANNEL_TYPES.BITRIX,
      (r) => r.type === CHANNEL_TYPES.BITRIX,
      bitrixSendSpy,
    );

    const notification: Notification = {
      id: "1",
      createdAt: "2025-01-01T00:00:00.000Z",
      contacts: [emailContact, bitrixContact],
      message,
    };

    const result = await sendToAllAvailableStrategy(notification, [
      emailChannel,
      bitrixChannel,
    ]);

    expect(result.status).toBe("success");
    expect(result.notification).toBe(notification);
    expect(result.warnings).toEqual([]);
    expect(result.details).toEqual([
      {
        contact: emailContact,
        channel: CHANNEL_TYPES.EMAIL,
      },
      {
        contact: bitrixContact,
        channel: CHANNEL_TYPES.BITRIX,
      },
    ]);
    expect(emailSendSpy).toHaveBeenCalledWith(emailContact, message);
    expect(bitrixSendSpy).toHaveBeenCalledWith(bitrixContact, message);
  });

  it("should return warnings for contact with no channels available", async () => {
    const emptyChannels: Channel[] = [];
    const notification: Notification = {
      id: "1",
      createdAt: "2025-01-01T00:00:00.000Z",
      contacts: [emailContact],
      message,
    };

    const result = await sendToAllAvailableStrategy(
      notification,
      emptyChannels,
    );

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

  it("should return success if at least one delivery succeeded, even if others failed", async () => {
    const workingSendSpy = vi.fn().mockResolvedValue(undefined);
    const failingSendSpy = vi
      .fn()
      .mockRejectedValue(new Error("Network error"));

    const workingChannel = createMockChannel(
      CHANNEL_TYPES.EMAIL,
      (r) => r.type === CHANNEL_TYPES.EMAIL,
      workingSendSpy,
    );

    const failingChannel = createMockChannel(
      CHANNEL_TYPES.BITRIX,
      (r) => r.type === CHANNEL_TYPES.BITRIX,
      failingSendSpy,
    );

    const notification: Notification = {
      id: "1",
      createdAt: "2025-01-01T00:00:00.000Z",
      contacts: [emailContact, bitrixContact],
      message,
    };

    const result = await sendToAllAvailableStrategy(notification, [
      workingChannel,
      failingChannel,
    ]);

    expect(result.status).toBe("success");
    expect(result.notification).toBe(notification);
    expect(result.warnings).toHaveLength(1);
    expect(result.warnings![0]).toEqual({
      message: "Ошибка отправки через канал bitrix",
      details: expect.any(Error),
      contact: bitrixContact.type,
      channel: CHANNEL_TYPES.BITRIX,
    });
    expect(result.details).toEqual([
      {
        contact: emailContact,
        channel: CHANNEL_TYPES.EMAIL,
      },
    ]);
    expect(workingSendSpy).toHaveBeenCalledWith(emailContact, message);
    expect(failingSendSpy).toHaveBeenCalledWith(bitrixContact, message);
  });

  it("should return failure if all contacts fail to deliver", async () => {
    const failingEmailSend = vi.fn().mockRejectedValue(new Error("SMTP error"));
    const failingBitrixSend = vi
      .fn()
      .mockRejectedValue(new Error("Bitrix API error"));

    const emailChannel = createMockChannel(
      CHANNEL_TYPES.EMAIL,
      (r) => r.type === CHANNEL_TYPES.EMAIL,
      failingEmailSend,
    );

    const bitrixChannel = createMockChannel(
      CHANNEL_TYPES.BITRIX,
      (r) => r.type === CHANNEL_TYPES.BITRIX,
      failingBitrixSend,
    );

    const notification: Notification = {
      id: "1",
      createdAt: "2025-01-01T00:00:00.000Z",
      contacts: [emailContact, bitrixContact],
      message,
    };

    const result = await sendToAllAvailableStrategy(notification, [
      emailChannel,
      bitrixChannel,
    ]);

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

  it("should return success if at least one contact is successfully delivered", async () => {
    const successfulSend = vi.fn().mockResolvedValue(undefined);
    const failingSend = vi.fn().mockRejectedValue(new Error("Failed"));

    const channelForEmail = createMockChannel(
      CHANNEL_TYPES.EMAIL,
      (r) => r.type === CHANNEL_TYPES.EMAIL,
      successfulSend,
    );

    const channelForBitrix = createMockChannel(
      CHANNEL_TYPES.BITRIX,
      (r) => r.type === CHANNEL_TYPES.BITRIX,
      failingSend,
    );

    const notification: Notification = {
      id: "1",
      createdAt: "2025-01-01T00:00:00.000Z",
      contacts: [emailContact, bitrixContact],
      message,
    };

    const result = await sendToAllAvailableStrategy(notification, [
      channelForEmail,
      channelForBitrix,
    ]);

    expect(result.status).toBe("success");
    expect(result.notification).toBe(notification);
    expect(result.warnings).toHaveLength(1);
    expect(result.warnings![0]).toEqual({
      message: "Ошибка отправки через канал bitrix",
      details: expect.any(Error),
      contact: bitrixContact.type,
      channel: CHANNEL_TYPES.BITRIX,
    });
    expect(result.details).toEqual([
      {
        contact: emailContact,
        channel: CHANNEL_TYPES.EMAIL,
      },
    ]);
    expect(successfulSend).toHaveBeenCalledWith(emailContact, message);
    expect(failingSend).toHaveBeenCalledWith(bitrixContact, message);
  });

  it("should include error details when channel throws", async () => {
    const originalError = new Error("Service unavailable");
    const failingSend = vi.fn().mockRejectedValue(originalError);

    const channel = createMockChannel(
      CHANNEL_TYPES.EMAIL,
      (r) => r.type === CHANNEL_TYPES.EMAIL,
      failingSend,
    );

    const notification: Notification = {
      id: "1",
      createdAt: "2025-01-01T00:00:00.000Z",
      contacts: [emailContact],
      message,
    };

    const result = await sendToAllAvailableStrategy(notification, [channel]);

    expect(result.status).toBe("failure");
    expect(result.notification).toBe(notification);
    expect(result.warnings).toHaveLength(1);
    expect(result.warnings![0]).toEqual({
      message: "Ошибка отправки через канал email",
      details: originalError,
      contact: emailContact.type,
      channel: CHANNEL_TYPES.EMAIL,
    });
    expect(result.error).toBeInstanceOf(Error);
    expect((result.error as Error).message).toBe(
      "Не удалось отправить уведомление ни одним из доступных способов",
    );
  });
});
