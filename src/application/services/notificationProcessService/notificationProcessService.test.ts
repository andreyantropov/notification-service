import { describe, it, expect, vi, beforeEach } from "vitest";
import { createNotificationProcessService } from "./notificationProcessService.js";
import { LogLevel } from "../../../shared/enums/LogLevel.js";
import { EventType } from "../notificationLoggerService/index.js";
import { Notification } from "../../../domain/interfaces/Notification.js";

const mockNotification: Notification = {
  id: 1,
  message: "Test message",
  createdAt: new Date(),
  client: {
    id: 1,
    lastName: "Doe",
    firstName: "John",
    secondName: "Smith",
    contacts: {
      email: "john.doe@example.com",
      bitrix: 12345,
    },
  },
};

const mockNotificationWithoutContacts: Notification = {
  id: 2,
  message: "Test message",
  createdAt: new Date(),
  client: {
    id: 2,
    lastName: "Doe",
    firstName: "Jane",
    secondName: "Smith",
    contacts: {},
  },
};

describe("NotificationProcessService", () => {
  const mockNotificationSource = {
    getNotifications: vi.fn(),
    deleteNotification: vi.fn(),
  };

  const mockNotificationDeliveryService = {
    send: vi.fn(),
  };

  const mockNotificationLogger = {
    writeLog: vi.fn(),
  };

  const mockResolveRecipients = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("processNotifications", () => {
    it("should process notifications successfully when recipients are available", async () => {
      mockNotificationSource.getNotifications.mockResolvedValue([
        mockNotification,
      ]);
      mockResolveRecipients.mockReturnValue(["email@example.com"]);

      const service = createNotificationProcessService({
        notificationSource: mockNotificationSource,
        notificationDeliveryService: mockNotificationDeliveryService,
        notificationLogger: mockNotificationLogger,
        resolveRecipients: mockResolveRecipients,
      });

      await service.processNotifications();

      expect(mockNotificationSource.getNotifications).toHaveBeenCalledTimes(1);
      expect(mockResolveRecipients).toHaveBeenCalledWith(mockNotification);
      expect(mockNotificationDeliveryService.send).toHaveBeenCalledWith(
        ["email@example.com"],
        mockNotification.message,
      );
      expect(mockNotificationLogger.writeLog).toHaveBeenCalledWith({
        level: LogLevel.Info,
        message: "Уведомление успешно отправлено",
        eventType: EventType.SendNotificationSuccess,
        spanId: "processNotifications",
        payload: mockNotification,
      });
      expect(mockNotificationSource.deleteNotification).toHaveBeenCalledWith(
        mockNotification.id,
      );
    });

    it("should log error and delete notification when no recipients are available", async () => {
      mockNotificationSource.getNotifications.mockResolvedValue([
        mockNotificationWithoutContacts,
      ]);
      mockResolveRecipients.mockReturnValue([]);

      const service = createNotificationProcessService({
        notificationSource: mockNotificationSource,
        notificationDeliveryService: mockNotificationDeliveryService,
        notificationLogger: mockNotificationLogger,
        resolveRecipients: mockResolveRecipients,
      });

      await service.processNotifications();

      expect(mockResolveRecipients).toHaveBeenCalledWith(
        mockNotificationWithoutContacts,
      );
      expect(mockNotificationDeliveryService.send).not.toHaveBeenCalled();
      expect(mockNotificationLogger.writeLog).toHaveBeenCalledWith({
        level: LogLevel.Error,
        message: "Отсутствуют контакты клиента",
        eventType: EventType.SendNotificationError,
        spanId: "processNotifications",
        payload: mockNotificationWithoutContacts,
        error: new Error("No recipients available"),
      });
      expect(mockNotificationSource.deleteNotification).toHaveBeenCalledWith(
        mockNotificationWithoutContacts.id,
      );
    });

    it("should log error when notification delivery fails", async () => {
      const deliveryError = new Error("Delivery failed");
      mockNotificationSource.getNotifications.mockResolvedValue([
        mockNotification,
      ]);
      mockResolveRecipients.mockReturnValue(["email@example.com"]);
      mockNotificationDeliveryService.send.mockRejectedValue(deliveryError);

      const service = createNotificationProcessService({
        notificationSource: mockNotificationSource,
        notificationDeliveryService: mockNotificationDeliveryService,
        notificationLogger: mockNotificationLogger,
        resolveRecipients: mockResolveRecipients,
      });

      await service.processNotifications();

      expect(mockNotificationDeliveryService.send).toHaveBeenCalled();
      expect(mockNotificationLogger.writeLog).toHaveBeenCalledWith({
        level: LogLevel.Error,
        message: "Не удалось отправить уведомление",
        eventType: EventType.SendNotificationError,
        spanId: "processNotifications",
        payload: mockNotification,
        error: deliveryError,
      });
      expect(mockNotificationSource.deleteNotification).toHaveBeenCalledWith(
        mockNotification.id,
      );
    });

    it("should log critical error when getting notifications fails", async () => {
      const dbError = new Error("DB connection failed");
      mockNotificationSource.getNotifications.mockRejectedValue(dbError);

      const service = createNotificationProcessService({
        notificationSource: mockNotificationSource,
        notificationDeliveryService: mockNotificationDeliveryService,
        notificationLogger: mockNotificationLogger,
        resolveRecipients: mockResolveRecipients,
      });

      await service.processNotifications();

      expect(mockNotificationLogger.writeLog).toHaveBeenCalledWith({
        level: LogLevel.Critical,
        message: "Не удалось считать или удалить данные из БД",
        eventType: EventType.SendNotificationError,
        spanId: "processNotifications",
        error: dbError,
      });
      expect(mockNotificationDeliveryService.send).not.toHaveBeenCalled();
      expect(mockNotificationSource.deleteNotification).not.toHaveBeenCalled();
    });

    it("should process multiple notifications sequentially", async () => {
      const secondNotification = { ...mockNotification, id: 2 };
      mockNotificationSource.getNotifications.mockResolvedValue([
        mockNotification,
        secondNotification,
      ]);
      mockResolveRecipients.mockReturnValue(["email@example.com"]);

      const service = createNotificationProcessService({
        notificationSource: mockNotificationSource,
        notificationDeliveryService: mockNotificationDeliveryService,
        notificationLogger: mockNotificationLogger,
        resolveRecipients: mockResolveRecipients,
      });

      await service.processNotifications();

      expect(mockNotificationDeliveryService.send).toHaveBeenCalledTimes(2);
      expect(mockNotificationSource.deleteNotification).toHaveBeenCalledWith(
        mockNotification.id,
      );
      expect(mockNotificationSource.deleteNotification).toHaveBeenCalledWith(
        secondNotification.id,
      );
    });

    it("should use empty array as default recipients when resolveRecipients is not provided", async () => {
      mockNotificationSource.getNotifications.mockResolvedValue([
        mockNotification,
      ]);

      const service = createNotificationProcessService({
        notificationSource: mockNotificationSource,
        notificationDeliveryService: mockNotificationDeliveryService,
        notificationLogger: mockNotificationLogger,
      });

      await service.processNotifications();

      expect(mockNotificationLogger.writeLog).toHaveBeenCalledWith(
        expect.objectContaining({
          level: LogLevel.Error,
          message: "Отсутствуют контакты клиента",
        }),
      );
      expect(mockNotificationSource.deleteNotification).toHaveBeenCalled();
    });
  });
});
