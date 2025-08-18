import { describe, it, expect, vi, beforeEach } from "vitest";
import { sendToFirstAvailableStrategy } from "./sendToFirstAvailableStrategy";
import { NotificationSender } from "../../../../../domain/interfaces/NotificationSender.js";
import { Recipient } from "../../../../../domain/types/Recipient.js";
import { Notification } from "../../../../../domain/interfaces/Notification.js";

class MockEmailSender implements NotificationSender {
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

class MockBitrixSender implements NotificationSender {
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

  let onError: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    onError = vi.fn();
  });

  it("should throw an error if no recipients are provided", async () => {
    const senders: NotificationSender[] = [new MockEmailSender()];
    const notification = { recipients: [], message };

    await expect(
      sendToFirstAvailableStrategy(senders, notification, onError),
    ).rejects.toThrow("Нет получателя для доставки уведомления");
    expect(onError).not.toHaveBeenCalled();
  });

  it("should send to the first recipient using a supported sender successfully", async () => {
    const emailSender = new MockEmailSender(true, true);
    const senders: NotificationSender[] = [emailSender];
    const notification: Notification = {
      recipients: [emailRecipient],
      message,
    };

    await expect(
      sendToFirstAvailableStrategy(senders, notification, onError),
    ).resolves.not.toThrow();

    expect(onError).not.toHaveBeenCalled();
  });

  it("should skip unsupported senders and use the next available one", async () => {
    const unsupportedEmailSender = new MockEmailSender(true, false);
    const bitrixSender = new MockBitrixSender(true, true);
    const senders: NotificationSender[] = [
      unsupportedEmailSender,
      bitrixSender,
    ];
    const notification: Notification = {
      recipients: [bitrixRecipient],
      message,
    };

    await expect(
      sendToFirstAvailableStrategy(senders, notification, onError),
    ).resolves.not.toThrow();

    expect(onError).not.toHaveBeenCalled();
  });

  it("should call onError when no senders are available for a recipient", async () => {
    const senders: NotificationSender[] = [];
    const notification: Notification = {
      recipients: [emailRecipient],
      message,
    };

    await expect(
      sendToFirstAvailableStrategy(senders, notification, onError),
    ).rejects.toThrow(
      "Не удалось отправить уведомление ни одним из доступных способов",
    );

    expect(onError).toHaveBeenCalledWith(
      { recipient: emailRecipient, message },
      expect.any(Error),
    );
    expect(onError.mock.lastCall![1].message).toContain(
      "не указано ни одного доступного канала",
    );
  });

  it("should try next recipient if first one fails all senders", async () => {
    const failingEmailSender = new MockEmailSender(false, true);
    const workingBitrixSender = new MockBitrixSender(true, true);
    const senders: NotificationSender[] = [
      failingEmailSender,
      workingBitrixSender,
    ];
    const notification: Notification = {
      recipients: [emailRecipient, bitrixRecipient],
      message,
    };

    await expect(
      sendToFirstAvailableStrategy(senders, notification, onError),
    ).resolves.not.toThrow();

    expect(onError).toHaveBeenCalledWith(
      { recipient: emailRecipient, message },
      expect.objectContaining({
        message: expect.stringContaining(
          "Ошибка отправки уведомления через канал MockEmailSender",
        ),
      }),
    );
  });

  it("should throw if no recipient can be delivered to", async () => {
    const failingEmailSender = new MockEmailSender(false, true);
    const failingBitrixSender = new MockBitrixSender(false, true);
    const senders: NotificationSender[] = [
      failingEmailSender,
      failingBitrixSender,
    ];
    const notification: Notification = {
      recipients: [emailRecipient, bitrixRecipient],
      message,
    };

    await expect(
      sendToFirstAvailableStrategy(senders, notification, onError),
    ).rejects.toThrow(
      "Не удалось отправить уведомление ни одним из доступных способов",
    );

    expect(onError).toHaveBeenCalledWith(
      { recipient: emailRecipient, message },
      expect.objectContaining({
        message: expect.stringContaining(
          "Ошибка отправки уведомления через канал MockEmailSender",
        ),
      }),
    );
    expect(onError).toHaveBeenCalledWith(
      { recipient: bitrixRecipient, message },
      expect.objectContaining({
        message: expect.stringContaining(
          "Ошибка отправки уведомления через канал MockBitrixSender",
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

  it("should stop after first successful delivery", async () => {
    const successfulSender = new MockEmailSender(true, true);
    const senders: NotificationSender[] = [successfulSender];
    const notification: Notification = {
      recipients: [emailRecipient, bitrixRecipient],
      message,
    };

    await expect(
      sendToFirstAvailableStrategy(senders, notification, onError),
    ).resolves.not.toThrow();

    expect(onError).not.toHaveBeenCalled();
  });

  it("should handle mixed recipient types and find correct sender", async () => {
    const emailSender = new MockEmailSender(true, true);
    const bitrixSender = new MockBitrixSender(true, true);
    const senders: NotificationSender[] = [bitrixSender, emailSender];
    const notification: Notification = {
      recipients: [bitrixRecipient, emailRecipient],
      message,
    };

    await expect(
      sendToFirstAvailableStrategy(senders, notification, onError),
    ).resolves.not.toThrow();

    expect(onError).not.toHaveBeenCalled();
  });

  it("should call onError with sender error and final delivery error when sender throws", async () => {
    const failingSender = new MockEmailSender(false, true);
    const senders: NotificationSender[] = [failingSender];
    const notification: Notification = {
      recipients: [emailRecipient],
      message,
    };

    await expect(
      sendToFirstAvailableStrategy(senders, notification, onError),
    ).rejects.toThrow(
      "Не удалось отправить уведомление ни одним из доступных способов",
    );

    expect(onError).toHaveBeenCalledTimes(2);

    const [firstCall, secondCall] = onError.mock.calls;

    expect(firstCall[0]).toEqual({ recipient: emailRecipient, message });
    expect(firstCall[1]).toBeInstanceOf(Error);
    expect(firstCall[1].message).toContain(
      "Ошибка отправки уведомления через канал MockEmailSender",
    );

    expect(secondCall[0]).toEqual({ recipient: emailRecipient, message });
    expect(secondCall[1]).toBeInstanceOf(Error);
    expect(secondCall[1].message).toContain(
      "Не удалось доставить уведомление адресату",
    );
  });
});
