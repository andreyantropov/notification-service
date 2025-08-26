import { vi, describe, it, expect, beforeEach } from "vitest";
import { createSendNotificationUseCase } from "./createSendNotificationUseCase.js";
import {
  isEmailRecipient,
  isBitrixRecipient,
  Recipient,
} from "../../../domain/types/Recipient.js";
import { LogLevel } from "../../../shared/enums/LogLevel.js";
import { EventType } from "../../services/createNotificationLoggerService/index.js";
import { Notification } from "../../../domain/interfaces/Notification.js";
import { SendResult } from "../../services/createNotificationDeliveryService/index.js";

describe("SendNotificationUseCase", () => {
  const mockNotificationDeliveryService = {
    send: vi.fn<
      (notification: Notification | Notification[]) => Promise<SendResult[]>
    >(),
  };

  const mockNotificationLoggerService = {
    writeLog: vi.fn(),
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
    it("should call deliveryService and log success when all notifications succeed", async () => {
      const results: SendResult[] = [{ success: true, notification }];

      mockNotificationDeliveryService.send.mockResolvedValueOnce(results);

      const { send } = createSendNotificationUseCase(
        mockNotificationDeliveryService,
        mockNotificationLoggerService,
      );

      const result = await send(notification);

      expect(mockNotificationDeliveryService.send).toHaveBeenCalledWith(
        notification,
      );
      expect(mockNotificationLoggerService.writeLog).toHaveBeenCalledWith({
        level: LogLevel.Info,
        message: "Уведомление успешно отправлено",
        eventType: EventType.NotificationSuccess,
        spanId: "createSendNotificationUseCase",
        payload: results, // ← весь массив
      });

      expect(result).toBe(results);
    });

    it("should log error when at least one notification fails", async () => {
      const notif1 = { ...notification, message: "Success" };
      const notif2 = { ...notification, message: "Fail" };

      const failError = new Error("Delivery failed");
      const results: SendResult[] = [
        { success: true, notification: notif1 },
        { success: false, notification: notif2, error: failError },
      ];

      mockNotificationDeliveryService.send.mockResolvedValueOnce(results);

      const { send } = createSendNotificationUseCase(
        mockNotificationDeliveryService,
        mockNotificationLoggerService,
      );

      const result = await send([notif1, notif2]);

      expect(mockNotificationDeliveryService.send).toHaveBeenCalledWith([
        notif1,
        notif2,
      ]);
      expect(mockNotificationLoggerService.writeLog).toHaveBeenCalledWith({
        level: LogLevel.Error,
        message: "Не удалось отправить уведомление",
        eventType: EventType.NotificationError,
        spanId: "createSendNotificationUseCase",
        payload: results, // ← весь массив
      });

      expect(result).toBe(results);
    });

    it("should log error when all notifications fail", async () => {
      const notif1 = { ...notification, message: "Fail 1" };
      const notif2 = { ...notification, message: "Fail 2" };

      const error1 = new Error("Network error");
      const error2 = new Error("Invalid recipient");

      const results: SendResult[] = [
        { success: false, notification: notif1, error: error1 },
        { success: false, notification: notif2, error: error2 },
      ];

      mockNotificationDeliveryService.send.mockResolvedValueOnce(results);

      const { send } = createSendNotificationUseCase(
        mockNotificationDeliveryService,
        mockNotificationLoggerService,
      );

      const result = await send([notif1, notif2]);

      expect(mockNotificationLoggerService.writeLog).toHaveBeenCalledWith({
        level: LogLevel.Error,
        message: "Не удалось отправить уведомление",
        eventType: EventType.NotificationError,
        spanId: "createSendNotificationUseCase",
        payload: results,
      });

      expect(result).toBe(results);
    });

    it("should handle single notification (object)", async () => {
      const results: SendResult[] = [{ success: true, notification }];

      mockNotificationDeliveryService.send.mockResolvedValueOnce(results);

      const { send } = createSendNotificationUseCase(
        mockNotificationDeliveryService,
        mockNotificationLoggerService,
      );

      const result = await send(notification);

      expect(result).toBe(results);
      expect(mockNotificationLoggerService.writeLog).toHaveBeenCalledWith({
        level: LogLevel.Info,
        message: "Уведомление успешно отправлено",
        eventType: EventType.NotificationSuccess,
        spanId: "createSendNotificationUseCase",
        payload: results,
      });
    });

    it("should handle array of notifications", async () => {
      const notif1 = { ...notification, message: "Msg 1" };
      const notif2 = { ...notification, message: "Msg 2" };

      const results: SendResult[] = [
        { success: true, notification: notif1 },
        { success: false, notification: notif2, error: new Error("Failed") },
      ];

      mockNotificationDeliveryService.send.mockResolvedValueOnce(results);

      const { send } = createSendNotificationUseCase(
        mockNotificationDeliveryService,
        mockNotificationLoggerService,
      );

      const result = await send([notif1, notif2]);

      expect(result).toBe(results);
      expect(mockNotificationLoggerService.writeLog).toHaveBeenCalledWith({
        level: LogLevel.Error,
        message: "Не удалось отправить уведомление",
        eventType: EventType.NotificationError,
        spanId: "createSendNotificationUseCase",
        payload: results,
      });
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

      const useCase = createSendNotificationUseCase(
        mockDeliveryServiceWithoutCheckHealth,
        mockNotificationLoggerService,
      );

      expect(useCase.checkHealth).toBeUndefined();
    });

    it("should call notificationDeliveryService.checkHealth if available", async () => {
      const mockCheckHealth = vi.fn().mockResolvedValue(undefined);
      const mockDeliveryServiceWithCheckHealth = {
        send: vi.fn(),
        checkHealth: mockCheckHealth,
      };

      const useCase = createSendNotificationUseCase(
        mockDeliveryServiceWithCheckHealth,
        mockNotificationLoggerService,
      );

      await expect(useCase.checkHealth?.()).resolves.not.toThrow();
      expect(mockCheckHealth).toHaveBeenCalled();
      expect(mockNotificationLoggerService.writeLog).toHaveBeenCalledWith({
        level: LogLevel.Info,
        message: "Проверка HealthCheck выполнена успешно",
        eventType: EventType.HealthCheckSuccess,
        spanId: "createSendNotificationUseCase",
      });
    });

    it("should log error and rethrow on health check failure", async () => {
      const testError = new Error("Health check failed");
      const mockCheckHealth = vi.fn().mockRejectedValue(testError);
      const mockDeliveryServiceWithError = {
        send: vi.fn(),
        checkHealth: mockCheckHealth,
      };

      const useCase = createSendNotificationUseCase(
        mockDeliveryServiceWithError,
        mockNotificationLoggerService,
      );

      await expect(useCase.checkHealth?.()).rejects.toThrow(testError);
      expect(mockCheckHealth).toHaveBeenCalled();
      expect(mockNotificationLoggerService.writeLog).toHaveBeenCalledWith({
        level: LogLevel.Error,
        message: "Проверка HealthCheck вернула ошибка",
        eventType: EventType.HealthCheckError,
        spanId: "createSendNotificationUseCase",
        error: testError,
      });
    });
  });
});
