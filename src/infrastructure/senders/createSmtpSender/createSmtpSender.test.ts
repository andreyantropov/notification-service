import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import nodemailer from "nodemailer";
import { createSmtpSender } from "./createSmtpSender.js";
import { SmtpSenderConfig } from "./interfaces/SmtpSenderConfig.js";
import { Sender } from "../../../domain/ports/Sender.js";
import { Recipient } from "../../../domain/types/Recipient.js";

vi.mock("nodemailer");

describe("createSmtpSender", () => {
  const mockConfig: SmtpSenderConfig = {
    host: "smtp.example.com",
    port: 587,
    secure: false,
    auth: {
      user: "user@example.com",
      pass: "password",
    },
    fromEmail: "no-reply@example.com",
  };

  let sender: Sender;
  let transporter: { sendMail: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    const mockTransporter = {
      sendMail: vi.fn().mockResolvedValue({}),
    };

    (nodemailer.createTransport as ReturnType<typeof vi.fn>).mockReturnValue(
      mockTransporter,
    );

    sender = createSmtpSender(mockConfig);
    transporter = mockTransporter;
  });

  it("should return a sender with isSupports and send methods", () => {
    expect(sender).toHaveProperty("isSupports");
    expect(sender).toHaveProperty("send");
    expect(typeof sender.isSupports).toBe("function");
    expect(typeof sender.send).toBe("function");
  });

  describe("isSupports", () => {
    it("should return true for an email recipient", () => {
      const recipient: Recipient = { type: "email", value: "test@example.com" };
      expect(sender.isSupports(recipient)).toBe(true);
    });

    it("should return false for a non-email recipient", () => {
      const recipient: Recipient = { type: "bitrix", value: 42 };
      expect(sender.isSupports(recipient)).toBe(false);
    });
  });

  describe("send", () => {
    const message = "Test message";
    const recipient: Recipient = { type: "email", value: "test@example.com" };

    it("should call sendMail with correct options", async () => {
      await sender.send(recipient, message);

      expect(transporter.sendMail).toHaveBeenCalledWith({
        from: `"ISPlanar" <${mockConfig.fromEmail}>`,
        to: recipient.value,
        subject: "ISPlanar",
        text: message,
      });
    });

    it("should resolve if sendMail resolves", async () => {
      await expect(sender.send(recipient, message)).resolves.not.toThrow();
    });

    it("should throw error if recipient is not email", async () => {
      const invalidRecipient: Recipient = { type: "bitrix", value: 42 };

      await expect(sender.send(invalidRecipient, message)).rejects.toThrow(
        `Неверный тип получателя: ожидается email, получено "bitrix"`,
      );
    });

    it("should throw error if sendMail rejects", async () => {
      const error = new Error("Send failed");
      transporter.sendMail.mockRejectedValue(error);

      await expect(sender.send(recipient, message)).rejects.toThrow(
        "Не удалось отправить email через SMTP",
      );

      expect(transporter.sendMail).toHaveBeenCalled();
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
      expect(sender.checkHealth).toBeDefined();
      expect(typeof sender.checkHealth).toBe("function");
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

      const newSender = createSmtpSender(mockConfig);

      await expect(newSender.checkHealth!()).resolves.not.toThrow();
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

      const newSender = createSmtpSender(mockConfig);

      await expect(newSender.checkHealth!()).rejects.toThrow(
        "SMTP сервер недоступен",
      );
    });

    it("should reject with 'SMTP сервер недоступен' on timeout", async () => {
      const pendingPromise = new Promise(() => {});
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

      const newSender = createSmtpSender(mockConfig);

      const checkHealthPromise = newSender.checkHealth!();

      vi.runOnlyPendingTimers();

      await expect(checkHealthPromise).rejects.toThrow(
        "SMTP сервер недоступен",
      );
    });
  });
});
