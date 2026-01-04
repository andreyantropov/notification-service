import { describe, it, expect, vi, beforeEach, Mock } from "vitest";

import { createLoggedDeliveryService } from "./createLoggedDeliveryService.js";
import type { LoggedDeliveryServiceDependencies } from "./interfaces/index.js";
import { CHANNEL_TYPES, EventType } from "@notification-platform/shared";
import type { Notification, Logger } from "@notification-platform/shared";
import type { DeliveryService, Result } from "../../interfaces/index.js";

type MockedDeliveryService = {
  send: Mock<(notifications: readonly Notification[]) => Promise<Result[]>>;
  checkHealth?: Mock<() => Promise<void>>;
};

const mockLoggerFn = (): Logger => ({
  debug: vi.fn(),
  info: vi.fn(),
  warning: vi.fn(),
  error: vi.fn(),
  critical: vi.fn(),
});

const createResult = (
  notification: Notification,
  status: "success" | "failure",
  warnings: { message: string }[] = [],
  error?: Error,
): Result => ({
  status,
  notification,
  ...(warnings.length > 0 ? { warnings } : {}),
  ...(error ? { error } : {}),
});

describe("createLoggedDeliveryService", () => {
  let mockDeliveryService: MockedDeliveryService;
  let mockLogger: Logger;
  let dependencies: LoggedDeliveryServiceDependencies;
  let notifications: Notification[];

  beforeEach(() => {
    mockDeliveryService = {
      send: vi.fn(),
      checkHealth: vi.fn(),
    };

    mockLogger = mockLoggerFn();

    dependencies = {
      deliveryService: mockDeliveryService as unknown as DeliveryService,
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
      mockDeliveryService.send.mockResolvedValue([]);

      const loggedService = createLoggedDeliveryService(dependencies);
      await loggedService.send(notifications);

      expect(mockDeliveryService.send).toHaveBeenCalledWith(notifications);
    });

    it("should log info with durationMs when all notifications are sent successfully without warnings", async () => {
      const mockResults: Result[] = [
        createResult(notifications[0], "success"),
        createResult(notifications[1], "success"),
      ];

      mockDeliveryService.send.mockResolvedValue(mockResults);

      const loggedService = createLoggedDeliveryService(dependencies);
      const results = await loggedService.send(notifications);

      expect(results).toEqual(mockResults);
      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.objectContaining({
          logLevel: "info",
          message: "Уведомления успешно отправлены",
          eventType: EventType.MessagePublish,
          durationMs: expect.any(Number),
          details: {
            notificationsCount: 2,
            successfulCount: 2,
            successfulIds: ["1", "2"],
          },
        }),
      );
    });

    it("should log warning with durationMs when notifications are sent with warnings", async () => {
      const mockResults: Result[] = [
        createResult(notifications[0], "success", [{ message: "Warning 1" }]),
        createResult(notifications[1], "success"),
      ];

      mockDeliveryService.send.mockResolvedValue(mockResults);

      const loggedService = createLoggedDeliveryService(dependencies);
      const results = await loggedService.send(notifications);

      expect(results).toEqual(mockResults);
      expect(mockLogger.warning).toHaveBeenCalledWith(
        expect.objectContaining({
          logLevel: "warning",
          message: "Уведомления отправлены с предупреждениями",
          eventType: EventType.MessagePublish,
          durationMs: expect.any(Number),
          details: {
            notificationsCount: 2,
            successfulCount: 2,
            warningCount: 1,
            successfulIds: ["1", "2"],
            warningIds: ["1"],
          },
        }),
      );
    });

    it("should log error when some notifications fail", async () => {
      const mockResults: Result[] = [
        createResult(notifications[0], "success"),
        createResult(notifications[1], "failure", [], new Error("Failed")),
      ];

      mockDeliveryService.send.mockResolvedValue(mockResults);

      const loggedService = createLoggedDeliveryService(dependencies);
      await loggedService.send(notifications);

      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.objectContaining({
          logLevel: "error",
          message: "Не удалось отправить часть уведомлений",
          eventType: EventType.MessagePublish,
          durationMs: expect.any(Number),
          details: {
            notificationsCount: 2,
            successfulCount: 1,
            failedCount: 1,
            warningCount: 0,
            successfulIds: ["1"],
            failedIds: ["2"],
            warningIds: [],
          },
        }),
      );
    });
  });

  describe("checkHealth method", () => {
    it("should wrap notification delivery service checkHealth call when checkHealth exists", async () => {
      const loggedService = createLoggedDeliveryService(dependencies);
      await loggedService.checkHealth!();
      expect(mockDeliveryService.checkHealth).toHaveBeenCalled();
    });

    it("should not create checkHealth method when notification delivery service does not have checkHealth", () => {
      const serviceWithoutHealthCheck = {
        ...mockDeliveryService,
        checkHealth: undefined,
      };

      const dependenciesWithoutHealthCheck: LoggedDeliveryServiceDependencies = {
        deliveryService: serviceWithoutHealthCheck as unknown as DeliveryService,
        logger: mockLogger,
      };

      const loggedService = createLoggedDeliveryService(dependenciesWithoutHealthCheck);
      expect(loggedService.checkHealth).toBeUndefined();
    });

    it("should log debug with durationMs when health check is successful", async () => {
      const loggedService = createLoggedDeliveryService(dependencies);
      await loggedService.checkHealth!();

      expect(mockLogger.debug).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Сервис доставки уведомлений готов к работе",
          eventType: EventType.HealthCheck,
          durationMs: expect.any(Number),
        }),
      );
    });

    it("should log error with durationMs and rethrow when health check fails", async () => {
      const testError = new Error("Health check failed");
      mockDeliveryService.checkHealth!.mockRejectedValue(testError);

      const loggedService = createLoggedDeliveryService(dependencies);
      await expect(loggedService.checkHealth!()).rejects.toThrow("Health check failed");

      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Сервис доставки уведомлений не отвечает",
          eventType: EventType.HealthCheck,
          durationMs: expect.any(Number),
          error: testError,
        }),
      );
    });
  });

  describe("returned service interface", () => {
    it("should return an object with correct methods", () => {
      const loggedService = createLoggedDeliveryService(dependencies);
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
      mockDeliveryService.send.mockRejectedValue(originalError);

      const loggedService = createLoggedDeliveryService(dependencies);
      await expect(loggedService.send(notifications)).rejects.toMatchObject({
        message: "Original send error",
        name: "SendError",
      });

      expect(mockLogger.error).not.toHaveBeenCalled();
      expect(mockLogger.info).not.toHaveBeenCalled();
      expect(mockLogger.warning).not.toHaveBeenCalled();
    });

    it("should preserve original error when health check fails", async () => {
      const originalError = new Error("Original health check error");
      originalError.name = "HealthCheckError";
      mockDeliveryService.checkHealth!.mockRejectedValue(originalError);

      const loggedService = createLoggedDeliveryService(dependencies);
      await expect(loggedService.checkHealth!()).rejects.toMatchObject({
        message: "Original health check error",
        name: "HealthCheckError",
      });
    });

    it("should log correct event types with durationMs for different operations", async () => {
      const mockResults: Result[] = [createResult(notifications[0], "success")];
      mockDeliveryService.send.mockResolvedValue(mockResults);

      const loggedService = createLoggedDeliveryService(dependencies);

      await loggedService.send(notifications);
      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.objectContaining({
          logLevel: "info",
          eventType: EventType.MessagePublish,
          durationMs: expect.any(Number),
        }),
      );

      await loggedService.checkHealth!();
      expect(mockLogger.debug).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: EventType.HealthCheck,
          durationMs: expect.any(Number),
        }),
      );
    });
  });
});