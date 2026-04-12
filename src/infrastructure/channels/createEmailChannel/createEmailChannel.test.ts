import nodemailer from "nodemailer";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { CHANNEL_TYPE, type Contact } from "../../../domain/types/index.js";

import { createEmailChannel } from "./createEmailChannel.js";
import { type EmailChannelConfig } from "./interfaces/index.js";

interface MockTransporter {
  sendMail: ReturnType<typeof vi.fn>;
  verify: ReturnType<typeof vi.fn>;
}

vi.mock("nodemailer", () => ({
  default: {
    createTransport: vi.fn(),
  },
}));

describe("createEmailChannel", () => {
  const mockConfig: EmailChannelConfig = {
    host: "smtp.test.com",
    port: 587,
    secure: false,
    auth: { user: "test", pass: "pass" },
    fromEmail: "sender@test.com",
    subject: "Test Subject",
    greetingTimeoutMs: 1000,
    socketTimeoutMs: 1000,
  };

  const mockTransporter: MockTransporter = {
    sendMail: vi.fn(),
    verify: vi.fn(),
  };

  const emailContact: Contact = {
    type: CHANNEL_TYPE.EMAIL,
    value: "target@test.com",
  };
  const bitrixContact: Contact = { type: CHANNEL_TYPE.BITRIX, value: 12345 };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(nodemailer.createTransport).mockReturnValue(
      mockTransporter as unknown as ReturnType<
        typeof nodemailer.createTransport
      >,
    );
  });

  it("should initialize nodemailer transporter with correct config", () => {
    createEmailChannel(mockConfig);

    expect(nodemailer.createTransport).toHaveBeenCalledWith(
      expect.objectContaining({
        host: mockConfig.host,
        greetingTimeout: mockConfig.greetingTimeoutMs,
      }),
    );
  });

  describe("isSupports", () => {
    it("should return true for email contact", () => {
      const channel = createEmailChannel(mockConfig);
      expect(channel.isSupports(emailContact)).toBe(true);
    });

    it("should return false for bitrix contact", () => {
      const channel = createEmailChannel(mockConfig);
      expect(channel.isSupports(bitrixContact)).toBe(false);
    });
  });

  describe("send", () => {
    it("should send email successfully when contact is valid", async () => {
      const channel = createEmailChannel(mockConfig);
      mockTransporter.sendMail.mockResolvedValueOnce({ messageId: "123" });

      await channel.send(emailContact, "Hello world");

      expect(mockTransporter.sendMail).toHaveBeenCalledWith({
        from: mockConfig.fromEmail,
        to: emailContact.value,
        subject: mockConfig.subject,
        text: "Hello world",
      });
    });

    it("should throw error when trying to send to non-email contact", async () => {
      const channel = createEmailChannel(mockConfig);

      await expect(channel.send(bitrixContact, "msg")).rejects.toThrow(
        `Неверный тип получателя: ожидается email, получено "${CHANNEL_TYPE.BITRIX}"`,
      );
    });

    it("should wrap SMTP errors", async () => {
      const channel = createEmailChannel(mockConfig);
      const smtpError = new Error("Connection lost");
      mockTransporter.sendMail.mockRejectedValueOnce(smtpError);

      await expect(channel.send(emailContact, "msg")).rejects.toThrow(
        "Не удалось отправить уведомления через SMTP",
      );
    });
  });

  describe("checkHealth", () => {
    it("should resolve when SMTP server is available", async () => {
      const channel = createEmailChannel(mockConfig);
      mockTransporter.verify.mockResolvedValueOnce(true);

      await expect(channel.checkHealth?.()).resolves.toBeUndefined();
    });

    it("should throw error when SMTP server is unavailable", async () => {
      const channel = createEmailChannel(mockConfig);
      mockTransporter.verify.mockRejectedValueOnce(new Error("Timeout"));

      await expect(channel.checkHealth?.()).rejects.toThrow(
        "SMTP сервер недоступен",
      );
    });
  });
});
