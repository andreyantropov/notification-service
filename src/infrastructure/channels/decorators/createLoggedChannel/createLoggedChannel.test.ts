import { describe, it, expect, vi, beforeEach, Mock } from "vitest";

import { createLoggedChannel } from "./createLoggedChannel.js";
import { LoggedChannelDependencies } from "./interfaces/LoggedChannelDependencies.js";
import { EventType } from "../../../../application/enums/index.js";
import { Logger } from "../../../../application/ports/Logger.js";
import { Channel } from "../../../../domain/ports/Channel.js";
import {
  CHANNEL_TYPES,
  ChannelTypes,
} from "../../../../domain/types/ChannelTypes.js";
import { Contact } from "../../../../domain/types/Contact.js";

const mockLoggerFn = (): Logger => ({
  debug: vi.fn() as Mock,
  info: vi.fn() as Mock,
  warning: vi.fn() as Mock,
  error: vi.fn() as Mock,
  critical: vi.fn() as Mock,
});

describe("createLoggedChannel", () => {
  let mockChannel: {
    type: ChannelTypes;
    isSupports: Mock;
    send: Mock;
    checkHealth?: Mock;
  };

  let mockLogger: Logger;
  let dependencies: LoggedChannelDependencies;
  let contact: Contact;
  const message = "test message";

  beforeEach(() => {
    mockChannel = {
      type: CHANNEL_TYPES.BITRIX,
      isSupports: vi.fn(),
      send: vi.fn(),
      checkHealth: vi.fn(),
    };

    mockLogger = mockLoggerFn();
    dependencies = {
      channel: mockChannel as Channel,
      logger: mockLogger,
    };

    contact = {
      type: CHANNEL_TYPES.EMAIL,
      value: "test@example.com",
    };

    vi.clearAllMocks();
  });

  describe("send method", () => {
    it("should call underlying channel.send method", async () => {
      const loggedChannel = createLoggedChannel(dependencies);
      await loggedChannel.send(contact, message);
      expect(mockChannel.send).toHaveBeenCalledWith(contact, message);
    });

    it("should log info with duration when send is successful", async () => {
      const loggedChannel = createLoggedChannel(dependencies);
      await loggedChannel.send(contact, message);

      expect(mockLogger.info).toHaveBeenCalledWith({
        message: "Уведомление успешно отправлено по каналу bitrix",
        eventType: EventType.MessagePublish,
        duration: expect.any(Number),
        details: {
          channelType: CHANNEL_TYPES.BITRIX,
          contactType: CHANNEL_TYPES.EMAIL,
        },
      });
    });

    it("should log error with duration and rethrow when send fails", async () => {
      const loggedChannel = createLoggedChannel(dependencies);
      const testError = new Error("Send failed");
      mockChannel.send.mockRejectedValue(testError);

      await expect(loggedChannel.send(contact, message)).rejects.toThrow(
        "Send failed",
      );

      expect(mockLogger.error).toHaveBeenCalledWith({
        message: "Не удалось отправить уведомление по каналу bitrix",
        eventType: EventType.MessagePublish,
        duration: expect.any(Number),
        details: {
          channelType: CHANNEL_TYPES.BITRIX,
          contactType: CHANNEL_TYPES.EMAIL,
        },
        error: testError,
      });
    });

    it("should include contact and message details in success log with duration", async () => {
      const loggedChannel = createLoggedChannel(dependencies);
      const customContact: Contact = {
        type: CHANNEL_TYPES.BITRIX,
        value: 99999,
      };
      const customMessage = "Custom test message";

      await loggedChannel.send(customContact, customMessage);

      expect(mockLogger.info).toHaveBeenCalledWith({
        message: "Уведомление успешно отправлено по каналу bitrix",
        eventType: EventType.MessagePublish,
        duration: expect.any(Number),
        details: {
          channelType: CHANNEL_TYPES.BITRIX,
          contactType: CHANNEL_TYPES.BITRIX,
        },
      });
    });

    it("should include contact and message details in error log with duration", async () => {
      const loggedChannel = createLoggedChannel(dependencies);
      const testError = new Error("Send failed");
      const customContact: Contact = {
        type: CHANNEL_TYPES.BITRIX,
        value: 99999,
      };
      const customMessage = "Custom test message";

      mockChannel.send.mockRejectedValue(testError);

      await expect(
        loggedChannel.send(customContact, customMessage),
      ).rejects.toThrow("Send failed");

      expect(mockLogger.error).toHaveBeenCalledWith({
        message: "Не удалось отправить уведомление по каналу bitrix",
        eventType: EventType.MessagePublish,
        duration: expect.any(Number),
        details: {
          channelType: CHANNEL_TYPES.BITRIX,
          contactType: CHANNEL_TYPES.BITRIX,
        },
        error: testError,
      });
    });
  });

  describe("checkHealth method", () => {
    it("should wrap channel.checkHealth call when checkHealth exists", async () => {
      const loggedChannel = createLoggedChannel(dependencies);
      await loggedChannel.checkHealth!();
      expect(mockChannel.checkHealth).toHaveBeenCalled();
    });

    it("should not create checkHealth method when channel does not have checkHealth", () => {
      const channelWithoutHealthCheck = {
        ...mockChannel,
        checkHealth: undefined,
      };

      const dependenciesWithoutHealthCheck = {
        ...dependencies,
        channel: channelWithoutHealthCheck as Channel,
      };

      const loggedChannel = createLoggedChannel(dependenciesWithoutHealthCheck);
      expect(loggedChannel.checkHealth).toBeUndefined();
    });

    it("should log debug with duration when health check is successful", async () => {
      const loggedChannel = createLoggedChannel(dependencies);
      await loggedChannel.checkHealth!();

      expect(mockLogger.debug).toHaveBeenCalledWith({
        message: "Канал bitrix готов к работе",
        eventType: EventType.HealthCheck,
        duration: expect.any(Number),
        details: { channelType: CHANNEL_TYPES.BITRIX },
      });
    });

    it("should log error with duration and rethrow when health check fails", async () => {
      const loggedChannel = createLoggedChannel(dependencies);
      const testError = new Error("Health check failed");
      mockChannel.checkHealth!.mockRejectedValue(testError);

      await expect(loggedChannel.checkHealth!()).rejects.toThrow(
        "Health check failed",
      );

      expect(mockLogger.error).toHaveBeenCalledWith({
        message: "Канал bitrix не отвечает",
        eventType: EventType.HealthCheck,
        duration: expect.any(Number),
        details: { channelType: CHANNEL_TYPES.BITRIX },
        error: testError,
      });
    });
  });

  describe("isSupports method", () => {
    it("should delegate isSupports calls to the underlying channel", () => {
      const loggedChannel = createLoggedChannel(dependencies);
      const testContact: Contact = { type: CHANNEL_TYPES.BITRIX, value: 99999 };
      mockChannel.isSupports.mockReturnValue(true);
      const result = loggedChannel.isSupports(testContact);
      expect(mockChannel.isSupports).toHaveBeenCalledWith(testContact);
      expect(result).toBe(true);
    });

    it("should not log isSupports calls", () => {
      const loggedChannel = createLoggedChannel(dependencies);
      const testContact: Contact = {
        type: CHANNEL_TYPES.EMAIL,
        value: "test@test.com",
      };
      loggedChannel.isSupports(testContact);
      expect(mockLogger.info).not.toHaveBeenCalled();
      expect(mockLogger.error).not.toHaveBeenCalled();
      expect(mockLogger.debug).not.toHaveBeenCalled();
    });
  });

  describe("returned channel interface", () => {
    it("should return an object with correct methods", () => {
      const loggedChannel = createLoggedChannel(dependencies);
      expect(loggedChannel).toHaveProperty("type", CHANNEL_TYPES.BITRIX);
      expect(loggedChannel).toHaveProperty("isSupports");
      expect(loggedChannel).toHaveProperty("send");
      expect(loggedChannel).toHaveProperty("checkHealth");
      expect(typeof loggedChannel.isSupports).toBe("function");
      expect(typeof loggedChannel.send).toBe("function");
      expect(typeof loggedChannel.checkHealth).toBe("function");
    });

    it("should maintain the same isSupports implementation as original channel", () => {
      const originalIsSupports = vi.fn();
      const customChannel = {
        type: CHANNEL_TYPES.EMAIL,
        isSupports: originalIsSupports,
        send: vi.fn(),
        checkHealth: vi.fn(),
      } as unknown as Channel;

      const customDependencies = {
        ...dependencies,
        channel: customChannel,
      };

      const loggedChannel = createLoggedChannel(customDependencies);
      const testContact: Contact = {
        type: CHANNEL_TYPES.EMAIL,
        value: "test@test.com",
      };
      loggedChannel.isSupports(testContact);
      expect(originalIsSupports).toHaveBeenCalledWith(testContact);
    });
  });

  describe("error handling", () => {
    it("should preserve original error when send fails", async () => {
      const loggedChannel = createLoggedChannel(dependencies);
      const originalError = new Error("Original send error");
      originalError.name = "CustomError";
      mockChannel.send.mockRejectedValue(originalError);
      await expect(loggedChannel.send(contact, message)).rejects.toMatchObject({
        message: "Original send error",
        name: "CustomError",
      });
    });

    it("should preserve original error when health check fails", async () => {
      const loggedChannel = createLoggedChannel(dependencies);
      const originalError = new Error("Original health check error");
      originalError.name = "HealthCheckError";
      mockChannel.checkHealth!.mockRejectedValue(originalError);
      await expect(loggedChannel.checkHealth!()).rejects.toMatchObject({
        message: "Original health check error",
        name: "HealthCheckError",
      });
    });

    it("should log correct event types with duration for different operations", async () => {
      const loggedChannel = createLoggedChannel(dependencies);

      await loggedChannel.send(contact, message);
      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: EventType.MessagePublish,
          duration: expect.any(Number),
        }),
      );

      await loggedChannel.checkHealth!();
      expect(mockLogger.debug).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: EventType.HealthCheck,
          duration: expect.any(Number),
        }),
      );
    });
  });
});
