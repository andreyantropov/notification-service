import nodemailer from "nodemailer";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

import { createEmailChannel } from "./createEmailChannel.js";
import type { EmailChannelConfig } from "./interfaces/index.js";
import { CHANNEL_TYPES } from "../../../domain/constants/index.js";
import type { Channel } from "../../../domain/ports/index.js";
import type { Contact } from "../../../domain/types/index.js";
import { noop } from "../../../shared/utils/index.js";

vi.mock("nodemailer");

describe("createEmailChannel", () => {
  const mockConfig: EmailChannelConfig = {
    host: "smtp.example.com",
    port: 587,
    secure: false,
    auth: {
      user: "user@example.com",
      pass: "password",
    },
    fromEmail: '"ISPlanar" <no-reply@example.com>',
  };

  let channel: Channel;
  let transporter: { sendMail: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    const mockTransporter = {
      sendMail: vi.fn().mockResolvedValue({}),
    };

    (nodemailer.createTransport as ReturnType<typeof vi.fn>).mockReturnValue(
      mockTransporter,
    );

    channel = createEmailChannel(mockConfig);
    transporter = mockTransporter;
  });

  it("should return a channel with isSupports and send methods", () => {
    expect(channel).toHaveProperty("isSupports");
    expect(channel).toHaveProperty("send");
    expect(typeof channel.isSupports).toBe("function");
    expect(typeof channel.send).toBe("function");
  });

  describe("isSupports", () => {
    it("should return true for an email contact", () => {
      const contact: Contact = {
        type: CHANNEL_TYPES.EMAIL,
        value: "test@example.com",
      };
      expect(channel.isSupports(contact)).toBe(true);
    });

    it("should return false for a non-email contact", () => {
      const contact: Contact = { type: CHANNEL_TYPES.BITRIX, value: 42 };
      expect(channel.isSupports(contact)).toBe(false);
    });
  });

  describe("send", () => {
    const message = "Test message";
    const contact: Contact = {
      type: CHANNEL_TYPES.EMAIL,
      value: "test@example.com",
    };

    it("should call sendMail with correct options", async () => {
      await channel.send(contact, message);

      expect(transporter.sendMail).toHaveBeenCalledWith({
        from: mockConfig.fromEmail,
        to: contact.value,
        subject: "ISPlanar",
        text: message,
      });
    });

    it("should resolve if sendMail resolves", async () => {
      await expect(channel.send(contact, message)).resolves.not.toThrow();
    });

    it("should throw error if contact is not email", async () => {
      const invalidContact: Contact = { type: CHANNEL_TYPES.BITRIX, value: 42 };

      await expect(channel.send(invalidContact, message)).rejects.toThrow(
        `Неверный тип получателя: ожидается email, получено "bitrix"`,
      );
    });

    it("should throw error if sendMail rejects", async () => {
      const error = new Error("Send failed");
      transporter.sendMail.mockRejectedValue(error);

      await expect(channel.send(contact, message)).rejects.toThrow(
        "Не удалось отправить email через SMTP",
      );

      expect(transporter.sendMail).toHaveBeenCalled();
    });

    it("should reject with timeout error if sendMail hangs", async () => {
      vi.useFakeTimers();

      transporter.sendMail.mockReturnValue(new Promise(() => {}));

      const sendPromise = channel.send(contact, message);

      vi.advanceTimersByTime(10_001);

      await expect(sendPromise).rejects.toThrow(
        "Не удалось отправить email через SMTP",
      );

      vi.useRealTimers();
    });
  });

  describe("checkHealth", () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("should have checkHealth method", () => {
      expect(channel.checkHealth).toBeDefined();
      expect(typeof channel.checkHealth).toBe("function");
    });

    it("should resolve if transporter.verify succeeds", async () => {
      const mockVerify = vi
        .fn()
        .mockImplementation((callback) => callback(null));
      const mockTransporter = {
        sendMail: vi.fn(),
        verify: mockVerify,
      };
      (nodemailer.createTransport as ReturnType<typeof vi.fn>).mockReturnValue(
        mockTransporter,
      );

      const newChannel = createEmailChannel(mockConfig);

      await expect(newChannel.checkHealth!()).resolves.not.toThrow();
    });

    it("should reject with 'SMTP сервер недоступен' if verify fails", async () => {
      const mockError = new Error("Connection refused");
      const mockVerify = vi
        .fn()
        .mockImplementation((callback) => callback(mockError));
      const mockTransporter = {
        sendMail: vi.fn(),
        verify: mockVerify,
      };
      (nodemailer.createTransport as ReturnType<typeof vi.fn>).mockReturnValue(
        mockTransporter,
      );

      const newChannel = createEmailChannel(mockConfig);

      await expect(newChannel.checkHealth!()).rejects.toThrow(
        "SMTP сервер недоступен",
      );
    });

    it("should reject with 'SMTP сервер недоступен' on timeout", async () => {
      const pendingPromise = new Promise(noop);
      const mockVerify = vi
        .fn()
        .mockImplementation((callback) => pendingPromise.then(callback));
      const mockTransporter = {
        sendMail: vi.fn(),
        verify: mockVerify,
      };
      (nodemailer.createTransport as ReturnType<typeof vi.fn>).mockReturnValue(
        mockTransporter,
      );

      const newChannel = createEmailChannel(mockConfig);

      const checkHealthPromise = newChannel.checkHealth!();

      vi.runOnlyPendingTimers();

      await expect(checkHealthPromise).rejects.toThrow(
        "SMTP сервер недоступен",
      );
    });
  });
});
