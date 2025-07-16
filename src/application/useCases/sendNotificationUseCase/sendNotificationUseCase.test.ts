import { vi, describe, it, expect, beforeEach } from "vitest";
import { createSendNotificationUseCase } from "../sendNotificationUseCase";
import {
  isEmailRecipient,
  isBitrixRecipient,
  Recipient,
} from "../../../domain/types/Recipient.js";
import { LogLevel } from "../../../shared/enums/LogLevel.js";
import { EventType } from "../../services/notificationLoggerService/index.js";
import { Notification } from "../../../domain/interfaces/Notification.js";

describe("SendNotificationUseCase", () => {
  const mockNotificationDeliveryService = {
    send: vi.fn(),
  };

  const mockNotificationLoggerService = {
    writeLog: vi.fn(),
  };

  const useCaseConfig = {
    notificationDeliveryService: mockNotificationDeliveryService,
    notificationLoggerService: mockNotificationLoggerService,
  };

  const recipients: Recipient[] = [
    { type: "email", value: "user1@example.com" },
    { type: "bitrix", value: 123456 },
  ];
  const message = "Тестовое уведомление";

  const notification: Notification = {
    recipients,
    message,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("send", () => {
    it("should call notificationDeliveryService.send and log success", async () => {
      mockNotificationDeliveryService.send.mockResolvedValueOnce(undefined);

      const { send } = createSendNotificationUseCase(useCaseConfig);

      await send(notification);

      expect(mockNotificationDeliveryService.send).toHaveBeenCalledWith(
        notification,
      );
      expect(mockNotificationLoggerService.writeLog).toHaveBeenCalledWith({
        level: LogLevel.Info,
        message: "Уведомление успешно отправлено",
        eventType: EventType.NotificationSuccess,
        spanId: "createSendNotificationUseCase",
        payload: {
          recipients,
          message,
        },
      });
    });

    it("should catch error and log error event", async () => {
      const testError = new Error("Network error");
      mockNotificationDeliveryService.send.mockRejectedValueOnce(testError);

      const { send } = createSendNotificationUseCase(useCaseConfig);

      await expect(send(notification)).rejects.toThrow("Network error");

      expect(mockNotificationDeliveryService.send).toHaveBeenCalledWith(
        notification,
      );
      expect(mockNotificationLoggerService.writeLog).toHaveBeenCalledWith({
        level: LogLevel.Error,
        message: "Не удалось отправить уведомление",
        eventType: EventType.NotificationError,
        spanId: "createSendNotificationUseCase",
        payload: {
          recipients,
          message,
        },
        error: testError,
      });
    });

    it("should throw the original error after logging", async () => {
      const testError = new Error("Internal server error");
      mockNotificationDeliveryService.send.mockRejectedValueOnce(testError);

      const { send } = createSendNotificationUseCase(useCaseConfig);

      await expect(send(notification)).rejects.toBe(testError);
    });

    it("should correctly narrow recipient types using type guards", () => {
      const emailRecipient: Recipient = {
        type: "email",
        value: "test@example.com",
      };
      const bitrixRecipient: Recipient = {
        type: "bitrix",
        value: 7890,
      };

      expect(isEmailRecipient(emailRecipient)).toBe(true);
      expect(isBitrixRecipient(emailRecipient)).toBe(false);

      expect(isEmailRecipient(bitrixRecipient)).toBe(false);
      expect(isBitrixRecipient(bitrixRecipient)).toBe(true);
    });
  });

  describe("checkHealth", () => {
    it("should not have checkHealth if notificationDeliveryService has no checkHealth", () => {
      const mockDeliveryServiceWithoutCheckHealth = {
        send: vi.fn(),
      };

      const config = {
        notificationDeliveryService: mockDeliveryServiceWithoutCheckHealth,
        notificationLoggerService: mockNotificationLoggerService,
      };

      const useCase = createSendNotificationUseCase(config);

      expect(useCase.checkHealth).toBeUndefined();
    });

    it("should call notificationDeliveryService.checkHealth if available", async () => {
      const mockCheckHealth = vi.fn().mockResolvedValue(undefined);
      const mockDeliveryServiceWithCheckHealth = {
        send: vi.fn(),
        checkHealth: mockCheckHealth,
      };

      const config = {
        notificationDeliveryService: mockDeliveryServiceWithCheckHealth,
        notificationLoggerService: mockNotificationLoggerService,
      };

      const useCase = createSendNotificationUseCase(config);

      await expect(useCase.checkHealth?.()).resolves.not.toThrow();
      expect(mockCheckHealth).toHaveBeenCalled();
    });

    it("should propagate error from checkHealth", async () => {
      const testError = new Error("Health check failed");
      const mockDeliveryServiceWithError = {
        send: vi.fn(),
        checkHealth: vi.fn().mockRejectedValue(testError),
      };

      const config = {
        notificationDeliveryService: mockDeliveryServiceWithError,
        notificationLoggerService: mockNotificationLoggerService,
      };

      const useCase = createSendNotificationUseCase(config);

      await expect(useCase.checkHealth?.()).rejects.toThrow(testError);
      expect(mockDeliveryServiceWithError.checkHealth).toHaveBeenCalled();
    });
  });
});
