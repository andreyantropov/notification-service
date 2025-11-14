import { describe, it, expect, vi } from "vitest";

import { sendToAllAvailableStrategy } from "./sendToAllAvailableStrategy.js";
import { Channel } from "../../../../../domain/ports/Channel.js";
import { Contact } from "../../../../../domain/types/Contact.js";
import { Notification } from "../../../../../domain/types/Notification.js";

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

const emailContact: Contact = { type: "email", value: "test@example.com" };
const bitrixContact: Contact = { type: "bitrix", value: 123 };
const message = "Test notification";

describe("sendToAllAvailableStrategy", () => {
  it("should return error if no contacts are provided", async () => {
    const channels = [
      createMockChannel(
        "email",
        () => true,
        async () => {},
      ),
    ];

    const notification = {
      id: "1",
      createdAt: "2025-01-01T00:00:00.000Z",
      contacts: [],
      message,
    };

    const result = await sendToAllAvailableStrategy(notification, channels);

    expect(result.success).toBe(false);
    expect(result.notification).toBe(notification);
    expect(result.error).toBeInstanceOf(Error);
    expect((result.error as Error).message).toBe(
      "Нет получателя или сообщение пустое",
    );
  });

  it("should return error if message is empty", async () => {
    const channels = [
      createMockChannel(
        "email",
        () => true,
        async () => {},
      ),
    ];

    const notification: Notification = {
      id: "1",
      createdAt: "2025-01-01T00:00:00.000Z",
      contacts: [emailContact],
      message: "",
    };

    const result = await sendToAllAvailableStrategy(notification, channels);

    expect(result.success).toBe(false);
    expect(result.notification).toBe(notification);
    expect(result.error).toBeInstanceOf(Error);
    expect((result.error as Error).message).toBe(
      "Нет получателя или сообщение пустое",
    );
  });

  it("should send to all contacts with supported channels successfully", async () => {
    const sendSpy = vi.fn().mockResolvedValue(undefined);

    const emailChannel = createMockChannel(
      "email",
      (r) => r.type === "email",
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

    expect(result.success).toBe(true);
    expect(result.notification).toBe(notification);
    expect(result.warnings).toEqual([]);
    expect(result.details).toEqual([
      {
        contact: emailContact,
        channel: "email",
      },
    ]);
    expect(sendSpy).toHaveBeenCalledWith(emailContact, message);
  });

  it("should handle multiple contacts with different supported channels", async () => {
    const emailSendSpy = vi.fn().mockResolvedValue(undefined);
    const bitrixSendSpy = vi.fn().mockResolvedValue(undefined);

    const emailChannel = createMockChannel(
      "email",
      (r) => r.type === "email",
      emailSendSpy,
    );

    const bitrixChannel = createMockChannel(
      "bitrix",
      (r) => r.type === "bitrix",
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

    expect(result.success).toBe(true);
    expect(result.notification).toBe(notification);
    expect(result.warnings).toEqual([]);
    expect(result.details).toEqual([
      {
        contact: emailContact,
        channel: "email",
      },
      {
        contact: bitrixContact,
        channel: "bitrix",
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

    expect(result.success).toBe(false);
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
      "email",
      (r) => r.type === "email",
      workingSendSpy,
    );

    const failingChannel = createMockChannel(
      "bitrix",
      (r) => r.type === "bitrix",
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

    expect(result.success).toBe(true);
    expect(result.notification).toBe(notification);
    expect(result.warnings).toHaveLength(1);
    expect(result.warnings![0]).toEqual({
      message: "Ошибка отправки через канал bitrix",
      details: expect.any(Error),
      contact: bitrixContact.type,
      channel: "bitrix",
    });
    expect(result.details).toEqual([
      {
        contact: emailContact,
        channel: "email",
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
      "email",
      (r) => r.type === "email",
      failingEmailSend,
    );

    const bitrixChannel = createMockChannel(
      "bitrix",
      (r) => r.type === "bitrix",
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

    expect(result.success).toBe(false);
    expect(result.notification).toBe(notification);
    expect(result.warnings).toHaveLength(2);
    expect(result.warnings![0]).toEqual({
      message: "Ошибка отправки через канал email",
      details: expect.any(Error),
      contact: emailContact.type,
      channel: "email",
    });
    expect(result.warnings![1]).toEqual({
      message: "Ошибка отправки через канал bitrix",
      details: expect.any(Error),
      contact: bitrixContact.type,
      channel: "bitrix",
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
      "email",
      (r) => r.type === "email",
      successfulSend,
    );

    const channelForBitrix = createMockChannel(
      "bitrix",
      (r) => r.type === "bitrix",
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

    expect(result.success).toBe(true);
    expect(result.notification).toBe(notification);
    expect(result.warnings).toHaveLength(1);
    expect(result.warnings![0]).toEqual({
      message: "Ошибка отправки через канал bitrix",
      details: expect.any(Error),
      contact: bitrixContact.type,
      channel: "bitrix",
    });
    expect(result.details).toEqual([
      {
        contact: emailContact,
        channel: "email",
      },
    ]);
    expect(successfulSend).toHaveBeenCalledWith(emailContact, message);
    expect(failingSend).toHaveBeenCalledWith(bitrixContact, message);
  });

  it("should include error details when channel throws", async () => {
    const originalError = new Error("Service unavailable");
    const failingSend = vi.fn().mockRejectedValue(originalError);

    const channel = createMockChannel(
      "email",
      (r) => r.type === "email",
      failingSend,
    );

    const notification: Notification = {
      id: "1",
      createdAt: "2025-01-01T00:00:00.000Z",
      contacts: [emailContact],
      message,
    };

    const result = await sendToAllAvailableStrategy(notification, [channel]);

    expect(result.success).toBe(false);
    expect(result.notification).toBe(notification);
    expect(result.warnings).toHaveLength(1);
    expect(result.warnings![0]).toEqual({
      message: "Ошибка отправки через канал email",
      details: originalError,
      contact: emailContact.type,
      channel: "email",
    });
    expect(result.error).toBeInstanceOf(Error);
    expect((result.error as Error).message).toBe(
      "Не удалось отправить уведомление ни одним из доступных способов",
    );
  });
});
