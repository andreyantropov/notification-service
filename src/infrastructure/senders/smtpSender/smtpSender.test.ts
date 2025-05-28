jest.mock("dotenv/config");
jest.mock("nodemailer", () => {
  const mockSendMail = jest.fn().mockResolvedValue({
    messageId: "mocked-message-id",
    response: "Mocked success response",
  });

  return {
    createTransport: jest.fn(() => ({
      sendMail: mockSendMail,
    })),
  };
});

import { createTransport } from "nodemailer";
import { createSmtpSender } from "./smtpSender";

describe("SMTP Client", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = {
      ...originalEnv,
      SMTP_HOST: "smtp.example.com",
      SMTP_PORT: "587",
      SMTP_LOGIN: "user@example.com",
      SMTP_PASSWORD: "password",
      SMTP_EMAIL: "no-reply@example.com",
    };
  });

  afterEach(() => {
    process.env = originalEnv;
    jest.resetModules();
    jest.restoreAllMocks();
  });

  it("should send email with correct parameters", async () => {
    const userEmail = "test@example.com";
    const message = "Тест сервиса уведомлений ISPlanar";

    const config = {
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: false,
      auth: {
        user: process.env.SMTP_LOGIN,
        pass: process.env.SMTP_PASSWORD,
      },
      fromEmail: process.env.SMTP_EMAIL,
    };

    const sender = createSmtpSender(config);

    const recipient = { type: "email" as const, value: userEmail };

    const result = await sender.send(recipient, message);

    expect(createTransport).toHaveBeenCalledWith({
      host: config.host,
      port: config.port,
      secure: false,
      auth: {
        user: config.auth.user,
        pass: config.auth.pass,
      },
    });

    const mockTransport = createTransport();
    expect(mockTransport.sendMail).toHaveBeenCalledWith({
      from: `"ISPlanar" <${config.fromEmail}>`,
      to: userEmail,
      subject: "ISPlanar",
      text: message,
    });

    expect(result).toBeUndefined();
  });

  it("should throw error if recipient is not email type", async () => {
    const message = "Тест сервиса уведомлений ISPlanar";

    const config = {
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: false,
      auth: {
        user: process.env.SMTP_LOGIN,
        pass: process.env.SMTP_PASSWORD,
      },
      fromEmail: process.env.SMTP_EMAIL,
    };

    const sender = createSmtpSender(config);

    const recipient = { type: "bitrix" as const, value: 123 };

    await expect(sender.send(recipient, message)).rejects.toThrow(
      "Неверный тип получателя",
    );
  });

  it("should handle errors if sendMail fails", async () => {
    const userEmail = "test@example.com";
    const message = "Тест сервиса уведомлений ISPlanar";

    const mockError = new Error("Failed to send email");
    const mockTransport = createTransport();
    (mockTransport.sendMail as jest.Mock).mockRejectedValueOnce(mockError);

    const config = {
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: false,
      auth: {
        user: process.env.SMTP_LOGIN,
        pass: process.env.SMTP_PASSWORD,
      },
      fromEmail: process.env.SMTP_EMAIL,
    };

    const sender = createSmtpSender(config);

    const recipient = { type: "email" as const, value: userEmail };

    await expect(sender.send(recipient, message)).rejects.toThrow(
      "Не удалось отправить email через SMTP",
    );
  });
});
