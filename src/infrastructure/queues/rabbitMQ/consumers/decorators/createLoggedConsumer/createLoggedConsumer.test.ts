import { describe, it, expect, vi, beforeEach } from "vitest";
import { Mock } from "vitest";

import { createLoggedConsumer } from "./createLoggedConsumer.js";
import { LoggedConsumerDependencies } from "./interfaces/LoggedConsumerDependencies.js";
import { Consumer } from "../../../../../../application/ports/Consumer.js";
import { Logger } from "../../../../../ports/Logger.js";
import { EventType } from "../../../../../telemetry/logging/enums/EventType.js";

type MockLogger = {
  readonly [K in keyof Logger]: Mock<
    (...args: Parameters<Logger[K]>) => ReturnType<Logger[K]>
  >;
};

describe("createLoggedConsumer", () => {
  let mockConsumer: {
    start: Mock<() => Promise<void>>;
    shutdown: Mock<() => Promise<void>>;
    checkHealth?: Mock<() => Promise<void>>;
  };

  let mockLogger: MockLogger;
  let dependencies: LoggedConsumerDependencies;

  beforeEach(() => {
    mockConsumer = {
      start: vi.fn(),
      shutdown: vi.fn(),
    };

    mockLogger = {
      debug: vi.fn(),
      info: vi.fn(),
      warning: vi.fn(),
      error: vi.fn(),
      critical: vi.fn(),
    };

    dependencies = {
      consumer: mockConsumer as unknown as Consumer,
      logger: mockLogger as unknown as Logger,
    };

    vi.clearAllMocks();
  });

  describe("start method", () => {
    it("should call underlying consumer.start method", async () => {
      const loggedConsumer = createLoggedConsumer(dependencies);
      await loggedConsumer.start();
      expect(mockConsumer.start).toHaveBeenCalledOnce();
    });

    it("should log debug on successful start", async () => {
      const loggedConsumer = createLoggedConsumer(dependencies);
      await loggedConsumer.start();

      expect(mockLogger.debug).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Consumer успешно запущен",
          eventType: EventType.Bootstrap,
          duration: expect.any(Number),
        }),
      );
    });

    it("should log error and rethrow on start failure", async () => {
      const startError = new Error("Start failed");
      mockConsumer.start.mockRejectedValue(startError);

      const loggedConsumer = createLoggedConsumer(dependencies);
      await expect(loggedConsumer.start()).rejects.toThrow("Start failed");

      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Не удалось запустить consumer",
          eventType: EventType.Bootstrap,
          duration: expect.any(Number),
          error: startError,
        }),
      );
    });
  });

  describe("shutdown method", () => {
    it("should call underlying consumer.shutdown", async () => {
      const loggedConsumer = createLoggedConsumer(dependencies);
      await loggedConsumer.shutdown();
      expect(mockConsumer.shutdown).toHaveBeenCalledOnce();
    });

    it("should log debug on successful shutdown", async () => {
      const loggedConsumer = createLoggedConsumer(dependencies);
      await loggedConsumer.shutdown();

      expect(mockLogger.debug).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Consumer успешно остановлен",
          eventType: EventType.Shutdown,
          duration: expect.any(Number),
        }),
      );
    });

    it("should log warning and rethrow on shutdown failure", async () => {
      const shutdownError = new Error("Shutdown failed");
      mockConsumer.shutdown.mockRejectedValue(shutdownError);

      const loggedConsumer = createLoggedConsumer(dependencies);
      await expect(loggedConsumer.shutdown()).rejects.toThrow(
        "Shutdown failed",
      );

      expect(mockLogger.warning).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Ошибка при остановке consumer",
          eventType: EventType.Shutdown,
          duration: expect.any(Number),
          error: shutdownError,
        }),
      );
    });
  });

  describe("checkHealth method", () => {
    it("should not include checkHealth if underlying consumer does not have it", () => {
      const loggedConsumer = createLoggedConsumer(dependencies);
      expect(loggedConsumer.checkHealth).toBeUndefined();
    });

    it("should include checkHealth if underlying consumer has it", () => {
      const consumerWithHealthCheck = {
        ...mockConsumer,
        checkHealth: vi.fn(),
      };
      const depsWithHealthCheck: LoggedConsumerDependencies = {
        consumer: consumerWithHealthCheck as unknown as Consumer,
        logger: mockLogger as unknown as Logger,
      };

      const loggedConsumer = createLoggedConsumer(depsWithHealthCheck);
      expect(loggedConsumer).toHaveProperty("checkHealth");
      expect(typeof loggedConsumer.checkHealth).toBe("function");
    });

    it("should call underlying consumer.checkHealth when invoked", async () => {
      const mockCheckHealth = vi.fn();
      const consumerWithHealthCheck = {
        ...mockConsumer,
        checkHealth: mockCheckHealth,
      };
      const depsWithHealthCheck: LoggedConsumerDependencies = {
        consumer: consumerWithHealthCheck as unknown as Consumer,
        logger: mockLogger as unknown as Logger,
      };

      const loggedConsumer = createLoggedConsumer(depsWithHealthCheck);
      await loggedConsumer.checkHealth!();

      expect(mockCheckHealth).toHaveBeenCalledOnce();
    });

    it("should log debug with duration when checkHealth succeeds", async () => {
      const mockCheckHealth = vi.fn();
      const consumerWithHealthCheck = {
        ...mockConsumer,
        checkHealth: mockCheckHealth,
      };
      const depsWithHealthCheck: LoggedConsumerDependencies = {
        consumer: consumerWithHealthCheck as unknown as Consumer,
        logger: mockLogger as unknown as Logger,
      };

      const loggedConsumer = createLoggedConsumer(depsWithHealthCheck);
      await loggedConsumer.checkHealth!();

      expect(mockLogger.debug).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Consumer готов к работе",
          eventType: EventType.HealthCheck,
          duration: expect.any(Number),
        }),
      );
    });

    it("should log error with duration and rethrow when checkHealth fails", async () => {
      const healthCheckError = new Error("Health check failed");
      const mockCheckHealth = vi.fn().mockRejectedValue(healthCheckError);
      const consumerWithHealthCheck = {
        ...mockConsumer,
        checkHealth: mockCheckHealth,
      };
      const depsWithHealthCheck: LoggedConsumerDependencies = {
        consumer: consumerWithHealthCheck as unknown as Consumer,
        logger: mockLogger as unknown as Logger,
      };

      const loggedConsumer = createLoggedConsumer(depsWithHealthCheck);
      await expect(loggedConsumer.checkHealth!()).rejects.toThrow(
        "Health check failed",
      );

      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Consumer недоступен",
          eventType: EventType.HealthCheck,
          duration: expect.any(Number),
          error: healthCheckError,
        }),
      );
    });
  });

  describe("event types", () => {
    it("should use Bootstrap event type for start success", async () => {
      const loggedConsumer = createLoggedConsumer(dependencies);
      await loggedConsumer.start();

      expect(mockLogger.debug).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: EventType.Bootstrap,
        }),
      );
    });

    it("should use Shutdown event type for shutdown success", async () => {
      const loggedConsumer = createLoggedConsumer(dependencies);
      await loggedConsumer.shutdown();

      expect(mockLogger.debug).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: EventType.Shutdown,
        }),
      );
    });

    it("should use HealthCheck event type for health check logs", async () => {
      const mockCheckHealth = vi.fn();
      const consumerWithHealthCheck = {
        ...mockConsumer,
        checkHealth: mockCheckHealth,
      };
      const depsWithHealthCheck: LoggedConsumerDependencies = {
        consumer: consumerWithHealthCheck as unknown as Consumer,
        logger: mockLogger as unknown as Logger,
      };

      const loggedConsumer = createLoggedConsumer(depsWithHealthCheck);
      await loggedConsumer.checkHealth!();

      expect(mockLogger.debug).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: EventType.HealthCheck,
        }),
      );
    });
  });

  describe("generic type support", () => {
    it("should work with string type", async () => {
      const stringMockConsumer = {
        start: vi.fn(),
        shutdown: vi.fn(),
      };
      const stringDependencies: LoggedConsumerDependencies = {
        consumer: stringMockConsumer as unknown as Consumer,
        logger: mockLogger as unknown as Logger,
      };

      const loggedConsumer = createLoggedConsumer(stringDependencies);
      await loggedConsumer.start();
      await loggedConsumer.shutdown();
    });

    it("should work with object type", async () => {
      const objectMockConsumer = {
        start: vi.fn(),
        shutdown: vi.fn(),
      };
      const objectDependencies: LoggedConsumerDependencies = {
        consumer: objectMockConsumer as unknown as Consumer,
        logger: mockLogger as unknown as Logger,
      };

      const loggedConsumer = createLoggedConsumer(objectDependencies);
      await loggedConsumer.start();
      await loggedConsumer.shutdown();
    });
  });
});
