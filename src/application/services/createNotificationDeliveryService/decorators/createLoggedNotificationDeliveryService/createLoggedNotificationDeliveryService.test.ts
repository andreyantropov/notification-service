import { describe, it, expect, vi, beforeEach, Mock } from "vitest";

import { createLoggedNotificationDeliveryService } from "./createLoggedNotificationDeliveryService.js";
import { LoggedNotificationDeliveryServiceDependencies } from "./interfaces/LoggedNotificationDeliveryServiceDependencies.js";
import { CHANNEL_TYPES } from "../../../../../domain/types/ChannelTypes.js";
import { Notification } from "../../../../../domain/types/Notification.js";
import { EventType } from "../../../../enums/index.js";
import { Logger } from "../../../../ports/Logger.js";
import { DeliveryResult } from "../../interfaces/DeliveryResult.js";
import { NotificationDeliveryService } from "../../interfaces/NotificationDeliveryService.js";

const mockLoggerFn = (): Logger => ({
  debug: vi.fn() as Mock,
  info: vi.fn() as Mock,
  warning: vi.fn() as Mock,
  error: vi.fn() as Mock,
  critical: vi.fn() as Mock,
});

describe("createLoggedNotificationDeliveryService", () => {
  let mockNotificationDeliveryService: {
    send: Mock;
    checkHealth?: Mock;
  };
  let mockLogger: Logger;
  let dependencies: LoggedNotificationDeliveryServiceDependencies;
  let notifications: Notification[];

  beforeEach(() => {
    mockNotificationDeliveryService = {
      send: vi.fn(),
      checkHealth: vi.fn(),
    };

    mockLogger = mockLoggerFn();
    dependencies = {
      notificationDeliveryService:
        mockNotificationDeliveryService as NotificationDeliveryService,
      logger: mockLogger,
    };

    notifications = [
      {
        id: "1",
        message: "Test notification 1",
        contacts: [{ type: CHANNEL_TYPES.EMAIL, value: "test1@example.com" }],
        createdAt: "2025-11-12T10:00:00Z",
      },
      {
        id: "2",
        message: "Test notification 2",
        contacts: [{ type: CHANNEL_TYPES.EMAIL, value: "test2@example.com" }],
        createdAt: "2025-11-12T10:00:00Z",
      },
    ];

    vi.clearAllMocks();
  });

  describe("send method", () => {
    it("should call underlying notification delivery service send method", async () => {
      mockNotificationDeliveryService.send.mockResolvedValue([]);

      const loggedService =
        createLoggedNotificationDeliveryService(dependencies);
      await loggedService.send(notifications);

      expect(mockNotificationDeliveryService.send).toHaveBeenCalledWith(
        notifications,
      );
    });

    it("should log info with duration when all notifications are sent successfully without warnings", async () => {
      const mockResults: DeliveryResult[] = [
        {
          success: true,
          notification: notifications[0],
        },
        {
          success: true,
          notification: notifications[1],
        },
      ];

      mockNotificationDeliveryService.send.mockResolvedValue(mockResults);

      const loggedService =
        createLoggedNotificationDeliveryService(dependencies);
      const results = await loggedService.send(notifications);

      expect(results).toEqual(mockResults);
      expect(mockLogger.info).toHaveBeenCalledWith({
        message: "Уведомления успешно отправлены",
        eventType: EventType.MessagePublish,
        duration: expect.any(Number),
        details: {
          notificationCount: 2,
          successfulCount: 2,
          failedCount: 0,
          warningCount: 0,
          successfulIds: ["1", "2"],
          failedIds: [],
          warningIds: [],
        },
      });
    });

    it("should log warning with duration when notifications are sent with warnings", async () => {
      const mockResults: DeliveryResult[] = [
        {
          success: true,
          notification: notifications[0],
          warnings: [{ message: "Warning 1" }],
        },
        {
          success: true,
          notification: notifications[1],
        },
      ];

      mockNotificationDeliveryService.send.mockResolvedValue(mockResults);

      const loggedService =
        createLoggedNotificationDeliveryService(dependencies);
      const results = await loggedService.send(notifications);

      expect(results).toEqual(mockResults);
      expect(mockLogger.warning).toHaveBeenCalledWith({
        message: "Уведомления отправлены с предупреждениями",
        eventType: EventType.MessagePublish,
        duration: expect.any(Number),
        details: {
          notificationCount: 2,
          successfulCount: 2,
          failedCount: 0,
          warningCount: 1,
          successfulIds: ["1", "2"],
          failedIds: [],
          warningIds: ["1"],
        },
      });
    });

    it("should log error with duration and rethrow when send fails", async () => {
      const testError = new Error("Send failed");
      mockNotificationDeliveryService.send.mockRejectedValue(testError);

      const loggedService =
        createLoggedNotificationDeliveryService(dependencies);
      await expect(loggedService.send(notifications)).rejects.toThrow(
        "Send failed",
      );

      expect(mockLogger.error).toHaveBeenCalledWith({
        message: "Не удалось отправить уведомления",
        eventType: EventType.MessagePublish,
        duration: expect.any(Number),
        details: {
          notificationCount: 2,
          notificationIds: ["1", "2"],
        },
        error: testError,
      });
    });

    it("should log correct statistics when some notifications fail", async () => {
      const mockResults: DeliveryResult[] = [
        {
          success: true,
          notification: notifications[0],
        },
        {
          success: false,
          notification: notifications[1],
          error: new Error("Failed to send"),
        },
      ];

      mockNotificationDeliveryService.send.mockResolvedValue(mockResults);

      const loggedService =
        createLoggedNotificationDeliveryService(dependencies);
      await loggedService.send(notifications);

      expect(mockLogger.info).toHaveBeenCalledWith({
        message: "Уведомления успешно отправлены",
        eventType: EventType.MessagePublish,
        duration: expect.any(Number),
        details: {
          notificationCount: 2,
          successfulCount: 1,
          failedCount: 1,
          warningCount: 0,
          successfulIds: ["1"],
          failedIds: ["2"],
          warningIds: [],
        },
      });
    });
  });

  describe("checkHealth method", () => {
    it("should wrap notification delivery service checkHealth call when checkHealth exists", async () => {
      const loggedService =
        createLoggedNotificationDeliveryService(dependencies);
      await loggedService.checkHealth!();
      expect(mockNotificationDeliveryService.checkHealth).toHaveBeenCalled();
    });

    it("should not create checkHealth method when notification delivery service does not have checkHealth", () => {
      const serviceWithoutHealthCheck = {
        ...mockNotificationDeliveryService,
        checkHealth: undefined,
      };

      const dependenciesWithoutHealthCheck = {
        ...dependencies,
        notificationDeliveryService:
          serviceWithoutHealthCheck as NotificationDeliveryService,
      };

      const loggedService = createLoggedNotificationDeliveryService(
        dependenciesWithoutHealthCheck,
      );
      expect(loggedService.checkHealth).toBeUndefined();
    });

    it("should log debug with duration when health check is successful", async () => {
      const loggedService =
        createLoggedNotificationDeliveryService(dependencies);
      await loggedService.checkHealth!();

      expect(mockLogger.debug).toHaveBeenCalledWith({
        message: "Сервис доставки уведомлений готов к работе",
        eventType: EventType.HealthCheck,
        duration: expect.any(Number),
      });
    });

    it("should log error with duration and rethrow when health check fails", async () => {
      const testError = new Error("Health check failed");
      mockNotificationDeliveryService.checkHealth!.mockRejectedValue(testError);

      const loggedService =
        createLoggedNotificationDeliveryService(dependencies);
      await expect(loggedService.checkHealth!()).rejects.toThrow(
        "Health check failed",
      );

      expect(mockLogger.error).toHaveBeenCalledWith({
        message: "Сервис доставки уведомлений не отвечает",
        eventType: EventType.HealthCheck,
        duration: expect.any(Number),
        error: testError,
      });
    });
  });

  describe("returned service interface", () => {
    it("should return an object with correct methods", () => {
      const loggedService =
        createLoggedNotificationDeliveryService(dependencies);
      expect(loggedService).toHaveProperty("send");
      expect(typeof loggedService.send).toBe("function");

      if (loggedService.checkHealth) {
        expect(typeof loggedService.checkHealth).toBe("function");
      }
    });
  });

  describe("error handling", () => {
    it("should preserve original error when send fails", async () => {
      const originalError = new Error("Original send error");
      originalError.name = "SendError";
      mockNotificationDeliveryService.send.mockRejectedValue(originalError);

      const loggedService =
        createLoggedNotificationDeliveryService(dependencies);
      await expect(loggedService.send(notifications)).rejects.toMatchObject({
        message: "Original send error",
        name: "SendError",
      });
    });

    it("should preserve original error when health check fails", async () => {
      const originalError = new Error("Original health check error");
      originalError.name = "HealthCheckError";
      mockNotificationDeliveryService.checkHealth!.mockRejectedValue(
        originalError,
      );

      const loggedService =
        createLoggedNotificationDeliveryService(dependencies);
      await expect(loggedService.checkHealth!()).rejects.toMatchObject({
        message: "Original health check error",
        name: "HealthCheckError",
      });
    });

    it("should log correct event types with duration for different operations", async () => {
      const mockResults: DeliveryResult[] = [
        {
          success: true,
          notification: notifications[0],
        },
      ];

      mockNotificationDeliveryService.send.mockResolvedValue(mockResults);

      const loggedService =
        createLoggedNotificationDeliveryService(dependencies);

      await loggedService.send(notifications);
      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: EventType.MessagePublish,
          duration: expect.any(Number),
        }),
      );

      await loggedService.checkHealth!();
      expect(mockLogger.debug).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: EventType.HealthCheck,
          duration: expect.any(Number),
        }),
      );
    });
  });
});
