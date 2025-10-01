import { describe, it, expect, vi, beforeEach, Mock } from "vitest";

import { createLoggedSender } from "./createLoggedSender.js";
import type { LoggedSenderDependencies } from "./interfaces/LoggedSenderDependencies.js";
import type { Sender } from "../../../../domain/ports/Sender.js";
import type { Recipient } from "../../../../domain/types/Recipient.js";
import { EventType } from "../../../../shared/enums/EventType.js";
import { LoggerAdapter } from "../../../ports/LoggerAdapter.js";

const mockLoggerAdapter = (): LoggerAdapter => ({
  debug: vi.fn(),
  info: vi.fn(),
  warning: vi.fn(),
  error: vi.fn(),
  critical: vi.fn(),
});

describe("createLoggedSender", () => {
  let mockSender: {
    type: "bitrix";
    isSupports: Mock;
    send: Mock;
    checkHealth?: Mock;
  };

  let mockLogger: LoggerAdapter;
  let dependencies: LoggedSenderDependencies;
  let recipient: Recipient;
  const message = "test message";

  beforeEach(() => {
    mockSender = {
      type: "bitrix",
      isSupports: vi.fn(),
      send: vi.fn(),
      checkHealth: vi.fn(),
    };

    mockLogger = mockLoggerAdapter();
    dependencies = {
      sender: mockSender as Sender,
      loggerAdapter: mockLogger,
    };

    recipient = {
      type: "email",
      value: "test@example.com",
    };

    vi.clearAllMocks();
  });

  describe("send method", () => {
    it("should call underlying sender.send method", async () => {
      const loggedSender = createLoggedSender(dependencies);

      await loggedSender.send(recipient, message);

      expect(mockSender.send).toHaveBeenCalledWith(recipient, message);
    });

    it("should log info when send is successful", async () => {
      const loggedSender = createLoggedSender(dependencies);

      await loggedSender.send(recipient, message);

      expect(mockLogger.info).toHaveBeenCalledWith({
        message: "Уведомление успешно отправлено по каналу bitrix",
        eventType: EventType.MessagePublish,
        details: { recipient, message },
      });
    });

    it("should log error and rethrow when send fails", async () => {
      const loggedSender = createLoggedSender(dependencies);
      const testError = new Error("Send failed");

      mockSender.send.mockRejectedValue(testError);

      await expect(loggedSender.send(recipient, message)).rejects.toThrow(
        "Send failed",
      );

      expect(mockLogger.error).toHaveBeenCalledWith({
        message: "Не удалось отправить уведомление по каналу bitrix",
        eventType: EventType.MessagePublish,
        details: { recipient, message },
        error: testError,
      });
    });

    it("should include recipient and message details in success log", async () => {
      const loggedSender = createLoggedSender(dependencies);
      const customRecipient: Recipient = {
        type: "bitrix",
        value: 99999,
      };
      const customMessage = "Custom test message";

      await loggedSender.send(customRecipient, customMessage);

      expect(mockLogger.info).toHaveBeenCalledWith({
        message: "Уведомление успешно отправлено по каналу bitrix",
        eventType: EventType.MessagePublish,
        details: {
          recipient: customRecipient,
          message: customMessage,
        },
      });
    });

    it("should include recipient and message details in error log", async () => {
      const loggedSender = createLoggedSender(dependencies);
      const testError = new Error("Send failed");
      const customRecipient: Recipient = {
        type: "bitrix",
        value: 99999,
      };
      const customMessage = "Custom test message";

      mockSender.send.mockRejectedValue(testError);

      await expect(
        loggedSender.send(customRecipient, customMessage),
      ).rejects.toThrow("Send failed");

      expect(mockLogger.error).toHaveBeenCalledWith({
        message: "Не удалось отправить уведомление по каналу bitrix",
        eventType: EventType.MessagePublish,
        details: {
          recipient: customRecipient,
          message: customMessage,
        },
        error: testError,
      });
    });
  });

  describe("checkHealth method", () => {
    it("should wrap sender.checkHealth call when checkHealth exists", async () => {
      const loggedSender = createLoggedSender(dependencies);

      await loggedSender.checkHealth!();

      expect(mockSender.checkHealth).toHaveBeenCalled();
    });

    it("should not create checkHealth method when sender does not have checkHealth", () => {
      const senderWithoutHealthCheck = {
        ...mockSender,
        checkHealth: undefined,
      };

      const dependenciesWithoutHealthCheck = {
        ...dependencies,
        sender: senderWithoutHealthCheck as Sender,
      };

      const loggedSender = createLoggedSender(dependenciesWithoutHealthCheck);

      expect(loggedSender.checkHealth).toBeUndefined();
    });

    it("should log debug when health check is successful", async () => {
      const loggedSender = createLoggedSender(dependencies);

      await loggedSender.checkHealth!();

      expect(mockLogger.debug).toHaveBeenCalledWith({
        message: "Сендер bitrix готов к работе",
        eventType: EventType.HealthCheck,
      });
    });

    it("should log error and rethrow when health check fails", async () => {
      const loggedSender = createLoggedSender(dependencies);
      const testError = new Error("Health check failed");

      mockSender.checkHealth!.mockRejectedValue(testError);

      await expect(loggedSender.checkHealth!()).rejects.toThrow(
        "Health check failed",
      );

      expect(mockLogger.error).toHaveBeenCalledWith({
        message: "Сендер bitrix не отвечает",
        eventType: EventType.HealthCheck,
        error: testError,
      });
    });
  });

  describe("isSupports method", () => {
    it("should delegate isSupports calls to the underlying sender", () => {
      const loggedSender = createLoggedSender(dependencies);

      const testRecipient: Recipient = {
        type: "bitrix",
        value: 99999,
      };

      mockSender.isSupports.mockReturnValue(true);

      const result = loggedSender.isSupports(testRecipient);

      expect(mockSender.isSupports).toHaveBeenCalledWith(testRecipient);
      expect(result).toBe(true);
    });

    it("should not log isSupports calls", () => {
      const loggedSender = createLoggedSender(dependencies);

      const testRecipient: Recipient = {
        type: "email",
        value: "test@test.com",
      };

      loggedSender.isSupports(testRecipient);

      expect(mockLogger.info).not.toHaveBeenCalled();
      expect(mockLogger.error).not.toHaveBeenCalled();
      expect(mockLogger.debug).not.toHaveBeenCalled();
    });
  });

  describe("returned sender interface", () => {
    it("should return an object with correct methods", () => {
      const loggedSender = createLoggedSender(dependencies);

      expect(loggedSender).toHaveProperty("type", "bitrix");
      expect(loggedSender).toHaveProperty("isSupports");
      expect(loggedSender).toHaveProperty("send");
      expect(loggedSender).toHaveProperty("checkHealth");
      expect(typeof loggedSender.isSupports).toBe("function");
      expect(typeof loggedSender.send).toBe("function");
      expect(typeof loggedSender.checkHealth).toBe("function");
    });

    it("should maintain the same isSupports implementation as original sender", () => {
      const originalIsSupports = vi.fn();
      const customSender = {
        type: "email",
        isSupports: originalIsSupports,
        send: vi.fn(),
        checkHealth: vi.fn(),
      } as unknown as Sender;

      const customDependencies = {
        ...dependencies,
        sender: customSender,
      };

      const loggedSender = createLoggedSender(customDependencies);
      const testRecipient: Recipient = {
        type: "email",
        value: "test@test.com",
      };

      loggedSender.isSupports(testRecipient);

      expect(originalIsSupports).toHaveBeenCalledWith(testRecipient);
    });
  });

  describe("error handling", () => {
    it("should preserve original error when send fails", async () => {
      const loggedSender = createLoggedSender(dependencies);
      const originalError = new Error("Original send error");
      originalError.name = "CustomError";

      mockSender.send.mockRejectedValue(originalError);

      await expect(loggedSender.send(recipient, message)).rejects.toMatchObject(
        {
          message: "Original send error",
          name: "CustomError",
        },
      );
    });

    it("should preserve original error when health check fails", async () => {
      const loggedSender = createLoggedSender(dependencies);
      const originalError = new Error("Original health check error");
      originalError.name = "HealthCheckError";

      mockSender.checkHealth!.mockRejectedValue(originalError);

      await expect(loggedSender.checkHealth!()).rejects.toMatchObject({
        message: "Original health check error",
        name: "HealthCheckError",
      });
    });

    it("should log correct event types for different operations", async () => {
      const loggedSender = createLoggedSender(dependencies);

      await loggedSender.send(recipient, message);
      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: EventType.MessagePublish,
        }),
      );

      await loggedSender.checkHealth!();
      expect(mockLogger.debug).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: EventType.HealthCheck,
        }),
      );
    });
  });
});
