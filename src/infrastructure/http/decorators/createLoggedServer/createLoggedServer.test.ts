import { describe, it, expect, vi, beforeEach, Mock } from "vitest";

import { createLoggedServer } from "./createLoggedServer.js";
import { LoggedServerDependencies } from "./interfaces/LoggedServerDependencies.js";
import { EventType } from "../../../../application/enums/index.js";
import { Logger } from "../../../../application/ports/Logger.js";
import { Server } from "../../interfaces/Server.js";

const mockLoggerFn = (): Logger => ({
  debug: vi.fn() as Mock,
  info: vi.fn() as Mock,
  warning: vi.fn() as Mock,
  error: vi.fn() as Mock,
  critical: vi.fn() as Mock,
});

describe("createLoggedServer", () => {
  let mockServer: {
    start: Mock;
    shutdown: Mock;
  };
  let mockLogger: Logger;
  let dependencies: LoggedServerDependencies;

  beforeEach(() => {
    mockServer = {
      start: vi.fn(),
      shutdown: vi.fn(),
    };

    mockLogger = mockLoggerFn();
    dependencies = {
      server: mockServer as Server,
      logger: mockLogger,
    };

    vi.clearAllMocks();
  });

  describe("start method", () => {
    it("should call underlying server start method", async () => {
      const loggedServer = createLoggedServer(dependencies);
      await loggedServer.start();

      expect(mockServer.start).toHaveBeenCalled();
    });

    it("should log debug with duration when start is successful", async () => {
      const loggedServer = createLoggedServer(dependencies);
      await loggedServer.start();

      expect(mockLogger.debug).toHaveBeenCalledWith({
        message: "Сервер успешно запущен",
        eventType: EventType.Bootstrap,
        duration: expect.any(Number),
      });
    });

    it("should log error with duration and rethrow when start fails", async () => {
      const loggedServer = createLoggedServer(dependencies);
      const testError = new Error("Start failed");
      mockServer.start.mockRejectedValue(testError);

      await expect(loggedServer.start()).rejects.toThrow("Start failed");

      expect(mockLogger.error).toHaveBeenCalledWith({
        message: "Не удалось запустить сервер",
        eventType: EventType.Bootstrap,
        duration: expect.any(Number),
        error: testError,
      });
    });
  });

  describe("shutdown method", () => {
    it("should call underlying server shutdown method", async () => {
      const loggedServer = createLoggedServer(dependencies);
      await loggedServer.shutdown();

      expect(mockServer.shutdown).toHaveBeenCalled();
    });

    it("should log debug with duration when shutdown is successful", async () => {
      const loggedServer = createLoggedServer(dependencies);
      await loggedServer.shutdown();

      expect(mockLogger.debug).toHaveBeenCalledWith({
        message: "Сервер успешно остановлен",
        eventType: EventType.Shutdown,
        duration: expect.any(Number),
      });
    });

    it("should log error with duration and rethrow when shutdown fails", async () => {
      const loggedServer = createLoggedServer(dependencies);
      const testError = new Error("Shutdown failed");
      mockServer.shutdown.mockRejectedValue(testError);

      await expect(loggedServer.shutdown()).rejects.toThrow("Shutdown failed");

      expect(mockLogger.error).toHaveBeenCalledWith({
        message: "Не удалось остановить сервер",
        eventType: EventType.Shutdown,
        duration: expect.any(Number),
        error: testError,
      });
    });
  });

  describe("returned server interface", () => {
    it("should return an object with correct methods", () => {
      const loggedServer = createLoggedServer(dependencies);
      expect(loggedServer).toHaveProperty("start");
      expect(loggedServer).toHaveProperty("shutdown");
      expect(typeof loggedServer.start).toBe("function");
      expect(typeof loggedServer.shutdown).toBe("function");
    });
  });

  describe("error handling", () => {
    it("should preserve original error when start fails", async () => {
      const loggedServer = createLoggedServer(dependencies);
      const originalError = new Error("Original start error");
      originalError.name = "StartError";
      mockServer.start.mockRejectedValue(originalError);
      await expect(loggedServer.start()).rejects.toMatchObject({
        message: "Original start error",
        name: "StartError",
      });
    });

    it("should preserve original error when shutdown fails", async () => {
      const loggedServer = createLoggedServer(dependencies);
      const originalError = new Error("Original shutdown error");
      originalError.name = "ShutdownError";
      mockServer.shutdown.mockRejectedValue(originalError);
      await expect(loggedServer.shutdown()).rejects.toMatchObject({
        message: "Original shutdown error",
        name: "ShutdownError",
      });
    });

    it("should log correct event types with duration for different operations", async () => {
      const loggedServer = createLoggedServer(dependencies);

      await loggedServer.start();
      expect(mockLogger.debug).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: EventType.Bootstrap,
          duration: expect.any(Number),
        }),
      );

      await loggedServer.shutdown();
      expect(mockLogger.debug).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: EventType.Shutdown,
          duration: expect.any(Number),
        }),
      );
    });
  });
});
