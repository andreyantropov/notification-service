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

describe("Mailer", () => {
  const originalEnv = process.env;

  let mail: (userEmail: string, message: string) => Promise<any>;

  beforeEach(async () => {
    process.env = {
      ...originalEnv,
      SMTP_HOST: "smtp.example.com",
      SMTP_PORT: "587",
      SMTP_LOGIN: "user@example.com",
      SMTP_PASSWORD: "password",
      SMTP_EMAIL: "no-reply@example.com",
    };

    const smtpModule = await import("./smtp");
    mail = smtpModule.mail;
  });

  afterEach(() => {
    process.env = originalEnv;

    jest.resetModules();
    jest.restoreAllMocks();
  });

  it("should send email with correct parameters", async () => {
    const userEmail = "test@example.com";
    const message = "Тест сервиса уведомлений ISPlanar";

    const result = await mail(userEmail, message);

    expect(require("nodemailer").createTransport).toHaveBeenCalledWith({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: false,
      auth: {
        user: process.env.SMTP_LOGIN,
        pass: process.env.SMTP_PASSWORD,
      },
    });

    expect(
      (require("nodemailer").createTransport() as any).sendMail,
    ).toHaveBeenCalledWith({
      from: `"ISPlanar" <${process.env.SMTP_EMAIL}>`,
      to: userEmail,
      subject: "ISPlanar",
      text: message,
    });

    expect(result).toEqual({
      messageId: "mocked-message-id",
      response: "Mocked success response",
    });
  });

  it("should handle errors if sendMail fails", async () => {
    const mockError = new Error("Failed to send email");
    (
      require("nodemailer").createTransport().sendMail as jest.Mock
    ).mockRejectedValueOnce(mockError);

    await expect(mail("test@example.com", "Test message")).rejects.toThrow(
      "Failed to send email",
    );
  });
});
