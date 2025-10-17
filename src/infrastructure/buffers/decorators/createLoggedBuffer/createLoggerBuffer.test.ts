import { describe, it, expect, vi, beforeEach, type Mock } from "vitest";

import { createLoggedBuffer } from "./createLoggedBuffer.js";
import { LoggedBufferDependencies } from "./interfaces/LoggedBufferDependencies.js";
import { Buffer } from "../../../../application/ports/Buffer.js";
import { Logger } from "../../../ports/Logger.js";
import { EventType } from "../../../telemetry/logging/enums/EventType.js";

const mockLoggerFn = (): Logger => ({
  debug: vi.fn() as Mock,
  info: vi.fn() as Mock,
  warning: vi.fn() as Mock,
  error: vi.fn() as Mock,
  critical: vi.fn() as Mock,
});

describe("createLoggedBuffer", () => {
  let mockBuffer: {
    append: Mock;
    takeAll: Mock;
  };

  let mockLogger: Logger;
  let dependencies: LoggedBufferDependencies<number>;
  const testItems = [1, 2, 3, 4, 5];

  beforeEach(() => {
    mockBuffer = {
      append: vi.fn(),
      takeAll: vi.fn(),
    };

    mockLogger = mockLoggerFn();
    dependencies = {
      buffer: mockBuffer as Buffer<number>,
      logger: mockLogger,
    };

    vi.clearAllMocks();
  });

  describe("append method", () => {
    it("should call underlying buffer.append method", async () => {
      const loggedBuffer = createLoggedBuffer(dependencies);
      await loggedBuffer.append(testItems);
      expect(mockBuffer.append).toHaveBeenCalledWith(testItems);
    });

    it("should log debug with item count and duration when append is successful", async () => {
      const loggedBuffer = createLoggedBuffer(dependencies);
      await loggedBuffer.append(testItems);

      expect(mockLogger.debug).toHaveBeenCalledWith({
        message: "5 элементов добавлено в буфер",
        eventType: EventType.CacheOperation,
        duration: expect.any(Number),
        details: testItems,
      });
    });

    it("should log error with duration and rethrow when append fails", async () => {
      const loggedBuffer = createLoggedBuffer(dependencies);
      const testError = new Error("Append failed");
      mockBuffer.append.mockRejectedValue(testError);

      await expect(loggedBuffer.append(testItems)).rejects.toThrow(
        "Append failed",
      );

      expect(mockLogger.error).toHaveBeenCalledWith({
        message: "Не удалось добавить элементы в буфер",
        eventType: EventType.CacheOperation,
        duration: expect.any(Number),
        details: testItems,
        error: testError,
      });
    });

    it("should handle empty array in append", async () => {
      const loggedBuffer = createLoggedBuffer(dependencies);
      const emptyItems: number[] = [];

      await loggedBuffer.append(emptyItems);

      expect(mockBuffer.append).toHaveBeenCalledWith(emptyItems);
      expect(mockLogger.debug).toHaveBeenCalledWith({
        message: "0 элементов добавлено в буфер",
        eventType: EventType.CacheOperation,
        duration: expect.any(Number),
        details: emptyItems,
      });
    });

    it("should include correct item details in success log with duration", async () => {
      const loggedBuffer = createLoggedBuffer(dependencies);
      const customItems = [10, 20, 30];

      await loggedBuffer.append(customItems);

      expect(mockLogger.debug).toHaveBeenCalledWith({
        message: "3 элементов добавлено в буфер",
        eventType: EventType.CacheOperation,
        duration: expect.any(Number),
        details: customItems,
      });
    });

    it("should include correct item details in error log with duration", async () => {
      const loggedBuffer = createLoggedBuffer(dependencies);
      const testError = new Error("Append failed");
      const customItems = [100, 200];

      mockBuffer.append.mockRejectedValue(testError);

      await expect(loggedBuffer.append(customItems)).rejects.toThrow(
        "Append failed",
      );

      expect(mockLogger.error).toHaveBeenCalledWith({
        message: "Не удалось добавить элементы в буфер",
        eventType: EventType.CacheOperation,
        duration: expect.any(Number),
        details: customItems,
        error: testError,
      });
    });

    it("should preserve original error when append fails", async () => {
      const loggedBuffer = createLoggedBuffer(dependencies);
      const originalError = new Error("Original append error");
      originalError.name = "BufferError";
      mockBuffer.append.mockRejectedValue(originalError);
      await expect(loggedBuffer.append(testItems)).rejects.toMatchObject({
        message: "Original append error",
        name: "BufferError",
      });
    });
  });

  describe("takeAll method", () => {
    it("should call underlying buffer.takeAll method", async () => {
      const loggedBuffer = createLoggedBuffer(dependencies);
      const expectedResult = [1, 2, 3];
      mockBuffer.takeAll.mockResolvedValue(expectedResult);
      const result = await loggedBuffer.takeAll();
      expect(mockBuffer.takeAll).toHaveBeenCalled();
      expect(result).toBe(expectedResult);
    });

    it("should log debug with item count and duration when takeAll is successful", async () => {
      const loggedBuffer = createLoggedBuffer(dependencies);
      const expectedResult = [10, 20, 30, 40];
      mockBuffer.takeAll.mockResolvedValue(expectedResult);
      await loggedBuffer.takeAll();

      expect(mockLogger.debug).toHaveBeenCalledWith({
        message: "4 элементов извлечено из буфера",
        eventType: EventType.CacheOperation,
        duration: expect.any(Number),
        details: expectedResult,
      });
    });

    it("should log error with duration and rethrow when takeAll fails", async () => {
      const loggedBuffer = createLoggedBuffer(dependencies);
      const testError = new Error("TakeAll failed");
      mockBuffer.takeAll.mockRejectedValue(testError);
      await expect(loggedBuffer.takeAll()).rejects.toThrow("TakeAll failed");

      expect(mockLogger.error).toHaveBeenCalledWith({
        message: "Не удалось извлечь элементы из буфера",
        eventType: EventType.CacheOperation,
        duration: expect.any(Number),
        error: testError,
      });
    });

    it("should handle empty result from takeAll", async () => {
      const loggedBuffer = createLoggedBuffer(dependencies);
      const emptyResult: number[] = [];
      mockBuffer.takeAll.mockResolvedValue(emptyResult);
      const result = await loggedBuffer.takeAll();
      expect(result).toEqual(emptyResult);
      expect(mockLogger.debug).toHaveBeenCalledWith({
        message: "0 элементов извлечено из буфера",
        eventType: EventType.CacheOperation,
        duration: expect.any(Number),
        details: emptyResult,
      });
    });

    it("should return the same result as underlying buffer", async () => {
      const loggedBuffer = createLoggedBuffer(dependencies);
      const expectedResult = [100, 200, 300];
      mockBuffer.takeAll.mockResolvedValue(expectedResult);
      const result = await loggedBuffer.takeAll();
      expect(result).toBe(expectedResult);
    });

    it("should preserve original error when takeAll fails", async () => {
      const loggedBuffer = createLoggedBuffer(dependencies);
      const originalError = new Error("Original takeAll error");
      originalError.name = "TakeAllError";
      mockBuffer.takeAll.mockRejectedValue(originalError);
      await expect(loggedBuffer.takeAll()).rejects.toMatchObject({
        message: "Original takeAll error",
        name: "TakeAllError",
      });
    });
  });

  describe("generic type support", () => {
    it("should work with string type", async () => {
      const stringDependencies: LoggedBufferDependencies<string> = {
        buffer: {
          append: vi.fn(),
          takeAll: vi.fn().mockResolvedValue(["a", "b", "c"]),
        } as Buffer<string>,
        logger: mockLogger,
      };

      const loggedBuffer = createLoggedBuffer(stringDependencies);
      const stringItems = ["test1", "test2"];

      await loggedBuffer.append(stringItems);
      const result = await loggedBuffer.takeAll();

      expect(stringDependencies.buffer.append).toHaveBeenCalledWith(
        stringItems,
      );
      expect(result).toEqual(["a", "b", "c"]);
    });

    it("should work with object type", async () => {
      interface TestObject {
        id: number;
        name: string;
      }

      const objectDependencies: LoggedBufferDependencies<TestObject> = {
        buffer: {
          append: vi.fn(),
          takeAll: vi.fn().mockResolvedValue([{ id: 1, name: "test" }]),
        } as Buffer<TestObject>,
        logger: mockLogger,
      };

      const loggedBuffer = createLoggedBuffer(objectDependencies);
      const objectItems: TestObject[] = [{ id: 1, name: "test" }];

      await loggedBuffer.append(objectItems);
      const result = await loggedBuffer.takeAll();

      expect(objectDependencies.buffer.append).toHaveBeenCalledWith(
        objectItems,
      );
      expect(result).toEqual([{ id: 1, name: "test" }]);
    });

    it("should work with complex nested types", async () => {
      type ComplexType = {
        id: number;
        data: {
          items: string[];
          metadata: Record<string, unknown>;
        };
      };

      const complexDependencies: LoggedBufferDependencies<ComplexType> = {
        buffer: {
          append: vi.fn(),
          takeAll: vi.fn().mockResolvedValue([]),
        } as Buffer<ComplexType>,
        logger: mockLogger,
      };

      const loggedBuffer = createLoggedBuffer(complexDependencies);
      const complexItems: ComplexType[] = [
        {
          id: 1,
          data: {
            items: ["a", "b"],
            metadata: { key: "value" },
          },
        },
      ];

      await loggedBuffer.append(complexItems);
      expect(complexDependencies.buffer.append).toHaveBeenCalledWith(
        complexItems,
      );
    });
  });

  describe("event types", () => {
    it("should use CacheOperation event type for append", async () => {
      const loggedBuffer = createLoggedBuffer(dependencies);
      await loggedBuffer.append(testItems);
      expect(mockLogger.debug).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: EventType.CacheOperation,
          duration: expect.any(Number),
        }),
      );
    });

    it("should use CacheOperation event type for takeAll", async () => {
      const loggedBuffer = createLoggedBuffer(dependencies);
      mockBuffer.takeAll.mockResolvedValue(testItems);
      await loggedBuffer.takeAll();
      expect(mockLogger.debug).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: EventType.CacheOperation,
          duration: expect.any(Number),
        }),
      );
    });

    it("should use CacheOperation event type for append errors", async () => {
      const loggedBuffer = createLoggedBuffer(dependencies);
      mockBuffer.append.mockRejectedValue(new Error("Failed"));
      await expect(loggedBuffer.append(testItems)).rejects.toThrow();
      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: EventType.CacheOperation,
          duration: expect.any(Number),
        }),
      );
    });

    it("should use CacheOperation event type for takeAll errors", async () => {
      const loggedBuffer = createLoggedBuffer(dependencies);
      mockBuffer.takeAll.mockRejectedValue(new Error("Failed"));
      await expect(loggedBuffer.takeAll()).rejects.toThrow();
      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: EventType.CacheOperation,
          duration: expect.any(Number),
        }),
      );
    });
  });

  describe("returned buffer interface", () => {
    it("should return an object with append and takeAll methods", () => {
      const loggedBuffer = createLoggedBuffer(dependencies);
      expect(loggedBuffer).toHaveProperty("append");
      expect(loggedBuffer).toHaveProperty("takeAll");
      expect(typeof loggedBuffer.append).toBe("function");
      expect(typeof loggedBuffer.takeAll).toBe("function");
    });

    it("should maintain method signatures", async () => {
      const loggedBuffer = createLoggedBuffer(dependencies);
      const appendResult = loggedBuffer.append(testItems);
      expect(appendResult).toBeInstanceOf(Promise);

      mockBuffer.takeAll.mockResolvedValue(testItems);
      const takeAllResult = await loggedBuffer.takeAll();
      expect(Array.isArray(takeAllResult)).toBe(true);
    });
  });
});
