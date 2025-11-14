import { describe, it, expect, vi, beforeEach } from "vitest";
import { Mock } from "vitest";

import { createLoggedProducer } from "./createLoggedProducer.js";
import { LoggedProducerDependencies } from "./interfaces/LoggedProducerDependencies.js";
import { EventType } from "../../../../../../application/enums/index.js";
import { Logger } from "../../../../../../application/ports/Logger.js";
import { Producer } from "../../../../../../application/ports/Producer.js";

type MockLogger = {
  readonly [K in keyof Logger]: Mock<
    (...args: Parameters<Logger[K]>) => ReturnType<Logger[K]>
  >;
};

describe("createLoggedProducer", () => {
  let mockProducer: {
    start: Mock<() => Promise<void>>;
    publish: Mock<(...args: number[][]) => Promise<void>>;
    shutdown: Mock<() => Promise<void>>;
    checkHealth?: Mock<() => Promise<void>>;
  };

  let mockLogger: MockLogger;
  let dependencies: LoggedProducerDependencies<number>;
  const testItems = [1, 2, 3, 4, 5];

  beforeEach(() => {
    mockProducer = {
      start: vi.fn(),
      publish: vi.fn(),
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
      producer: mockProducer as unknown as Producer<number>,
      logger: mockLogger as unknown as Logger,
    };

    vi.clearAllMocks();
  });

  describe("publish method", () => {
    it("should call underlying producer.publish method", async () => {
      const loggedProducer = createLoggedProducer(dependencies);
      await loggedProducer.publish(testItems);
      expect(mockProducer.publish).toHaveBeenCalledWith(testItems);
    });

    it("should log debug with item count and duration when publish is successful", async () => {
      const loggedProducer = createLoggedProducer(dependencies);
      await loggedProducer.publish(testItems);

      expect(mockLogger.debug).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "5 сообщений опубликовано в очередь",
          eventType: EventType.MessagePublish,
          duration: expect.any(Number),
          details: {
            count: 5,
          },
        }),
      );
    });

    it("should log error with duration, count, and rethrow when publish fails", async () => {
      const loggedProducer = createLoggedProducer(dependencies);
      const testError = new Error("Publish failed");
      mockProducer.publish.mockRejectedValue(testError);

      await expect(loggedProducer.publish(testItems)).rejects.toThrow(
        "Publish failed",
      );

      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Не удалось опубликовать сообщения",
          eventType: EventType.MessagePublish,
          duration: expect.any(Number),
          details: {
            count: 5,
          },
          error: testError,
        }),
      );
    });

    it("should handle empty array in publish", async () => {
      const loggedProducer = createLoggedProducer(dependencies);
      const emptyItems: number[] = [];

      await loggedProducer.publish(emptyItems);

      expect(mockProducer.publish).toHaveBeenCalledWith(emptyItems);
      expect(mockLogger.debug).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "0 сообщений опубликовано в очередь",
          eventType: EventType.MessagePublish,
          duration: expect.any(Number),
          details: {
            count: 0,
          },
        }),
      );
    });

    it("should preserve original error when publish fails", async () => {
      const loggedProducer = createLoggedProducer(dependencies);
      const originalError = new Error("Original publish error");
      originalError.name = "PublishError";
      mockProducer.publish.mockRejectedValue(originalError);
      await expect(loggedProducer.publish(testItems)).rejects.toMatchObject({
        message: "Original publish error",
        name: "PublishError",
      });
    });
  });

  describe("checkHealth method", () => {
    it("should not include checkHealth if underlying producer does not have it", () => {
      const loggedProducer = createLoggedProducer(dependencies);
      expect(loggedProducer.checkHealth).toBeUndefined();
    });

    it("should include checkHealth if underlying producer has it", () => {
      const producerWithHealthCheck = {
        ...mockProducer,
        checkHealth: vi.fn(),
      };
      const depsWithHealthCheck: LoggedProducerDependencies<number> = {
        producer: producerWithHealthCheck as unknown as Producer<number>,
        logger: mockLogger as unknown as Logger,
      };

      const loggedProducer = createLoggedProducer(depsWithHealthCheck);
      expect(loggedProducer).toHaveProperty("checkHealth");
      expect(typeof loggedProducer.checkHealth).toBe("function");
    });

    it("should call underlying producer.checkHealth when invoked", async () => {
      const mockCheckHealth = vi.fn();
      const producerWithHealthCheck = {
        ...mockProducer,
        checkHealth: mockCheckHealth,
      };
      const depsWithHealthCheck: LoggedProducerDependencies<number> = {
        producer: producerWithHealthCheck as unknown as Producer<number>,
        logger: mockLogger as unknown as Logger,
      };

      const loggedProducer = createLoggedProducer(depsWithHealthCheck);
      await loggedProducer.checkHealth!();

      expect(mockCheckHealth).toHaveBeenCalledOnce();
    });

    it("should log debug with duration when checkHealth succeeds", async () => {
      const mockCheckHealth = vi.fn();
      const producerWithHealthCheck = {
        ...mockProducer,
        checkHealth: mockCheckHealth,
      };
      const depsWithHealthCheck: LoggedProducerDependencies<number> = {
        producer: producerWithHealthCheck as unknown as Producer<number>,
        logger: mockLogger as unknown as Logger,
      };

      const loggedProducer = createLoggedProducer(depsWithHealthCheck);
      await loggedProducer.checkHealth!();

      expect(mockLogger.debug).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Producer готов к работе",
          eventType: EventType.HealthCheck,
          duration: expect.any(Number),
        }),
      );
    });

    it("should log error with duration and rethrow when checkHealth fails", async () => {
      const healthCheckError = new Error("Health check failed");
      const mockCheckHealth = vi.fn().mockRejectedValue(healthCheckError);
      const producerWithHealthCheck = {
        ...mockProducer,
        checkHealth: mockCheckHealth,
      };
      const depsWithHealthCheck: LoggedProducerDependencies<number> = {
        producer: producerWithHealthCheck as unknown as Producer<number>,
        logger: mockLogger as unknown as Logger,
      };

      const loggedProducer = createLoggedProducer(depsWithHealthCheck);

      await expect(loggedProducer.checkHealth!()).rejects.toThrow(
        "Health check failed",
      );

      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Producer недоступен",
          eventType: EventType.HealthCheck,
          duration: expect.any(Number),
          error: healthCheckError,
        }),
      );
    });

    it("should use HealthCheck event type for health check logs", async () => {
      const mockCheckHealth = vi.fn();
      const producerWithHealthCheck = {
        ...mockProducer,
        checkHealth: mockCheckHealth,
      };
      const depsWithHealthCheck: LoggedProducerDependencies<number> = {
        producer: producerWithHealthCheck as unknown as Producer<number>,
        logger: mockLogger as unknown as Logger,
      };

      const loggedProducer = createLoggedProducer(depsWithHealthCheck);
      await loggedProducer.checkHealth!();

      expect(mockLogger.debug).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: EventType.HealthCheck,
        }),
      );
    });
  });

  describe("start and shutdown methods", () => {
    it("should always include start and shutdown", () => {
      const loggedProducer = createLoggedProducer(dependencies);
      expect(loggedProducer).toHaveProperty("start");
      expect(typeof loggedProducer.start).toBe("function");
      expect(loggedProducer).toHaveProperty("shutdown");
      expect(typeof loggedProducer.shutdown).toBe("function");
    });

    it("should call underlying producer.start and shutdown", async () => {
      const loggedProducer = createLoggedProducer(dependencies);
      await loggedProducer.start();
      await loggedProducer.shutdown();

      expect(mockProducer.start).toHaveBeenCalledOnce();
      expect(mockProducer.shutdown).toHaveBeenCalledOnce();
    });

    it("should log info on successful start and shutdown", async () => {
      const loggedProducer = createLoggedProducer(dependencies);
      await loggedProducer.start();
      await loggedProducer.shutdown();

      expect(mockLogger.debug).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Producer успешно запущен",
          eventType: EventType.Bootstrap,
        }),
      );

      expect(mockLogger.debug).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Producer успешно остановлен",
          eventType: EventType.Shutdown,
        }),
      );
    });

    it("should log error on start failure and rethrow", async () => {
      const startError = new Error("Start failed");
      mockProducer.start.mockRejectedValue(startError);

      const loggedProducer = createLoggedProducer(dependencies);
      await expect(loggedProducer.start()).rejects.toThrow("Start failed");

      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Не удалось запустить producer",
          eventType: EventType.Bootstrap,
          error: startError,
        }),
      );
    });

    it("should log warning on shutdown failure and rethrow", async () => {
      const shutdownError = new Error("Shutdown failed");
      mockProducer.shutdown.mockRejectedValue(shutdownError);

      const loggedProducer = createLoggedProducer(dependencies);
      await expect(loggedProducer.shutdown()).rejects.toThrow(
        "Shutdown failed",
      );

      expect(mockLogger.warning).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Ошибка при остановке producer",
          eventType: EventType.Shutdown,
          error: shutdownError,
        }),
      );
    });
  });

  describe("event types", () => {
    it("should use MessagePublish event type for publish success", async () => {
      const loggedProducer = createLoggedProducer(dependencies);
      await loggedProducer.publish(testItems);
      expect(mockLogger.debug).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: EventType.MessagePublish,
        }),
      );
    });

    it("should use MessagePublish event type for publish errors", async () => {
      const loggedProducer = createLoggedProducer(dependencies);
      const testError = new Error("Publish failed");
      mockProducer.publish.mockRejectedValue(testError);
      await expect(loggedProducer.publish(testItems)).rejects.toThrow();

      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: EventType.MessagePublish,
        }),
      );
    });
  });

  describe("generic type support", () => {
    it("should work with string type", async () => {
      const stringMockProducer = {
        start: vi.fn(),
        publish: vi.fn(),
        shutdown: vi.fn(),
      };
      const stringDependencies: LoggedProducerDependencies<string> = {
        producer: stringMockProducer as unknown as Producer<string>,
        logger: mockLogger as unknown as Logger,
      };

      const loggedProducer = createLoggedProducer(stringDependencies);
      const stringItems = ["msg1", "msg2"];

      await loggedProducer.publish(stringItems);
      expect(stringMockProducer.publish).toHaveBeenCalledWith(stringItems);
    });

    it("should work with object type", async () => {
      interface TestMessage {
        id: number;
        content: string;
      }

      const objectMockProducer = {
        start: vi.fn(),
        publish: vi.fn(),
        shutdown: vi.fn(),
      };
      const objectDependencies: LoggedProducerDependencies<TestMessage> = {
        producer: objectMockProducer as unknown as Producer<TestMessage>,
        logger: mockLogger as unknown as Logger,
      };

      const loggedProducer = createLoggedProducer(objectDependencies);
      const objectItems: TestMessage[] = [{ id: 1, content: "test" }];

      await loggedProducer.publish(objectItems);
      expect(objectMockProducer.publish).toHaveBeenCalledWith(objectItems);
    });
  });
});
