import { describe, it, expect, vi, beforeEach, Mock } from "vitest";

import { createTracedBuffer } from "./createTracedBuffer.js";
import type { TracedBufferDependencies } from "./interfaces/TracedBufferDependencies.js";
import type { Buffer } from "../../../../application/ports/Buffer.js";
import type { TracingContextManager } from "../../../../application/ports/TracingContextManager.js";

describe("createTracedBuffer", () => {
  let mockBuffer: {
    append: Mock;
    takeAll: Mock;
  };

  let mockTracingContextManager: {
    startActiveSpan: Mock;
    active: Mock;
    with: Mock;
    getTraceContext: Mock;
  };

  let dependencies: TracedBufferDependencies<number>;
  const testItems = [1, 2, 3, 4, 5];

  beforeEach(() => {
    mockBuffer = {
      append: vi.fn(),
      takeAll: vi.fn(),
    };

    mockTracingContextManager = {
      startActiveSpan: vi.fn(),
      active: vi.fn(),
      with: vi.fn(),
      getTraceContext: vi.fn(),
    };

    dependencies = {
      buffer: mockBuffer as Buffer<number>,
      tracingContextManager: mockTracingContextManager as TracingContextManager,
    };

    vi.clearAllMocks();
  });

  describe("append method", () => {
    it("should wrap buffer.append call with tracing span", async () => {
      const tracedBuffer = createTracedBuffer(dependencies);

      mockTracingContextManager.startActiveSpan.mockImplementation(
        async (name, options, fn) => {
          return fn({
            end: vi.fn(),
            recordException: vi.fn(),
            setStatus: vi.fn(),
          });
        },
      );

      await tracedBuffer.append(testItems);

      expect(mockTracingContextManager.startActiveSpan).toHaveBeenCalledWith(
        "buffer.append",
        {
          kind: "INTERNAL",
          attributes: {
            "buffer.items.count": 5,
          },
        },
        expect.any(Function),
      );

      expect(mockBuffer.append).toHaveBeenCalledWith(testItems);
    });

    it("should propagate append result through tracing span", async () => {
      const tracedBuffer = createTracedBuffer(dependencies);

      mockTracingContextManager.startActiveSpan.mockImplementation(
        async (name, options, fn) => {
          return fn({
            end: vi.fn(),
            recordException: vi.fn(),
            setStatus: vi.fn(),
          });
        },
      );

      const result = await tracedBuffer.append(testItems);

      expect(result).toBeUndefined();
    });

    it("should handle errors from buffer.append within tracing span", async () => {
      const tracedBuffer = createTracedBuffer(dependencies);
      const testError = new Error("Append failed");

      mockBuffer.append.mockRejectedValue(testError);

      mockTracingContextManager.startActiveSpan.mockImplementation(
        async (name, options, fn) => {
          return await fn({
            end: vi.fn(),
            recordException: vi.fn(),
            setStatus: vi.fn(),
          });
        },
      );

      await expect(tracedBuffer.append(testItems)).rejects.toThrow(
        "Append failed",
      );
      expect(mockBuffer.append).toHaveBeenCalledWith(testItems);
    });

    it("should use correct span name based on buffer constructor name", async () => {
      const customBuffer = {
        ...mockBuffer,
      };

      const customDependencies = {
        ...dependencies,
        buffer: customBuffer as Buffer<number>,
      };

      const tracedBuffer = createTracedBuffer(customDependencies);

      mockTracingContextManager.startActiveSpan.mockImplementation(
        async (name, options, fn) => {
          return fn({
            end: vi.fn(),
            recordException: vi.fn(),
            setStatus: vi.fn(),
          });
        },
      );

      await tracedBuffer.append(testItems);

      expect(mockTracingContextManager.startActiveSpan).toHaveBeenCalledWith(
        "buffer.append",
        expect.any(Object),
        expect.any(Function),
      );
    });

    it("should include correct items count in span attributes", async () => {
      const tracedBuffer = createTracedBuffer(dependencies);
      const customItems = [10, 20, 30];

      mockTracingContextManager.startActiveSpan.mockImplementation(
        async (name, options, fn) => {
          return fn({
            end: vi.fn(),
            recordException: vi.fn(),
            setStatus: vi.fn(),
          });
        },
      );

      await tracedBuffer.append(customItems);

      expect(mockTracingContextManager.startActiveSpan).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          attributes: expect.objectContaining({
            "buffer.items.count": 3,
          }),
        }),
        expect.any(Function),
      );
    });

    it("should handle empty array in append", async () => {
      const tracedBuffer = createTracedBuffer(dependencies);
      const emptyItems: number[] = [];

      mockTracingContextManager.startActiveSpan.mockImplementation(
        async (name, options, fn) => {
          return fn({
            end: vi.fn(),
            recordException: vi.fn(),
            setStatus: vi.fn(),
          });
        },
      );

      await tracedBuffer.append(emptyItems);

      expect(mockTracingContextManager.startActiveSpan).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          attributes: expect.objectContaining({
            "buffer.items.count": 0,
          }),
        }),
        expect.any(Function),
      );
      expect(mockBuffer.append).toHaveBeenCalledWith(emptyItems);
    });
  });

  describe("takeAll method", () => {
    it("should wrap buffer.takeAll call with tracing span", async () => {
      const tracedBuffer = createTracedBuffer(dependencies);
      const expectedResult = [1, 2, 3];

      mockTracingContextManager.startActiveSpan.mockImplementation(
        async (name, options, fn) => {
          return fn({
            end: vi.fn(),
            recordException: vi.fn(),
            setStatus: vi.fn(),
          });
        },
      );

      mockBuffer.takeAll.mockResolvedValue(expectedResult);

      const result = await tracedBuffer.takeAll();

      expect(mockTracingContextManager.startActiveSpan).toHaveBeenCalledWith(
        "buffer.takeAll",
        {
          kind: "INTERNAL",
        },
        expect.any(Function),
      );

      expect(mockBuffer.takeAll).toHaveBeenCalled();
      expect(result).toBe(expectedResult);
    });

    it("should propagate takeAll result through tracing span", async () => {
      const tracedBuffer = createTracedBuffer(dependencies);
      const expectedResult = [10, 20, 30];

      mockTracingContextManager.startActiveSpan.mockImplementation(
        async (name, options, fn) => {
          return fn({
            end: vi.fn(),
            recordException: vi.fn(),
            setStatus: vi.fn(),
          });
        },
      );

      mockBuffer.takeAll.mockResolvedValue(expectedResult);

      const result = await tracedBuffer.takeAll();

      expect(result).toBe(expectedResult);
    });

    it("should handle errors from buffer.takeAll within tracing span", async () => {
      const tracedBuffer = createTracedBuffer(dependencies);
      const testError = new Error("TakeAll failed");

      mockBuffer.takeAll.mockRejectedValue(testError);

      mockTracingContextManager.startActiveSpan.mockImplementation(
        async (name, options, fn) => {
          return await fn({
            end: vi.fn(),
            recordException: vi.fn(),
            setStatus: vi.fn(),
          });
        },
      );

      await expect(tracedBuffer.takeAll()).rejects.toThrow("TakeAll failed");
      expect(mockBuffer.takeAll).toHaveBeenCalled();
    });

    it("should use correct span name for takeAll based on buffer constructor name", async () => {
      const customBuffer = {
        ...mockBuffer,
      };

      const customDependencies = {
        ...dependencies,
        buffer: customBuffer as Buffer<number>,
      };

      const tracedBuffer = createTracedBuffer(customDependencies);

      mockTracingContextManager.startActiveSpan.mockImplementation(
        async (name, options, fn) => {
          return fn({
            end: vi.fn(),
            recordException: vi.fn(),
            setStatus: vi.fn(),
          });
        },
      );

      mockBuffer.takeAll.mockResolvedValue([]);

      await tracedBuffer.takeAll();

      expect(mockTracingContextManager.startActiveSpan).toHaveBeenCalledWith(
        "buffer.takeAll",
        expect.any(Object),
        expect.any(Function),
      );
    });

    it("should not include items count in takeAll span attributes", async () => {
      const tracedBuffer = createTracedBuffer(dependencies);

      mockTracingContextManager.startActiveSpan.mockImplementation(
        async (name, options, fn) => {
          return fn({
            end: vi.fn(),
            recordException: vi.fn(),
            setStatus: vi.fn(),
          });
        },
      );

      mockBuffer.takeAll.mockResolvedValue(testItems);

      await tracedBuffer.takeAll();

      const spanCall =
        mockTracingContextManager.startActiveSpan.mock.calls.find(
          (call) => call[0] === "buffer.takeAll",
        );
      expect(spanCall?.[1]).toEqual({
        kind: "INTERNAL",
      });
    });
  });

  describe("generic type support", () => {
    it("should work with string type", async () => {
      const stringBuffer = {
        append: vi.fn(),
        takeAll: vi.fn().mockResolvedValue(["a", "b", "c"]),
        constructor: {
          name: "StringBuffer",
        },
      };

      const stringDependencies: TracedBufferDependencies<string> = {
        buffer: stringBuffer as Buffer<string>,
        tracingContextManager:
          mockTracingContextManager as TracingContextManager,
      };

      const tracedBuffer = createTracedBuffer(stringDependencies);

      mockTracingContextManager.startActiveSpan.mockImplementation(
        async (name, options, fn) => {
          return fn({
            end: vi.fn(),
            recordException: vi.fn(),
            setStatus: vi.fn(),
          });
        },
      );

      const stringItems = ["test1", "test2"];
      await tracedBuffer.append(stringItems);
      const result = await tracedBuffer.takeAll();

      expect(stringBuffer.append).toHaveBeenCalledWith(stringItems);
      expect(result).toEqual(["a", "b", "c"]);
    });

    it("should work with object type", async () => {
      interface TestObject {
        id: number;
        name: string;
      }

      const objectBuffer = {
        append: vi.fn(),
        takeAll: vi.fn().mockResolvedValue([{ id: 1, name: "test" }]),
        constructor: {
          name: "ObjectBuffer",
        },
      };

      const objectDependencies: TracedBufferDependencies<TestObject> = {
        buffer: objectBuffer as Buffer<TestObject>,
        tracingContextManager:
          mockTracingContextManager as TracingContextManager,
      };

      const tracedBuffer = createTracedBuffer(objectDependencies);

      mockTracingContextManager.startActiveSpan.mockImplementation(
        async (name, options, fn) => {
          return fn({
            end: vi.fn(),
            recordException: vi.fn(),
            setStatus: vi.fn(),
          });
        },
      );

      const objectItems: TestObject[] = [{ id: 1, name: "test" }];
      await tracedBuffer.append(objectItems);
      const result = await tracedBuffer.takeAll();

      expect(objectBuffer.append).toHaveBeenCalledWith(objectItems);
      expect(result).toEqual([{ id: 1, name: "test" }]);
    });
  });

  describe("span configuration", () => {
    it("should use INTERNAL kind for both append and takeAll spans", async () => {
      const tracedBuffer = createTracedBuffer(dependencies);

      mockTracingContextManager.startActiveSpan.mockImplementation(
        async (name, options, fn) => {
          return fn({
            end: vi.fn(),
            recordException: vi.fn(),
            setStatus: vi.fn(),
          });
        },
      );

      mockBuffer.takeAll.mockResolvedValue([]);

      await tracedBuffer.append(testItems);
      await tracedBuffer.takeAll();

      const appendCall =
        mockTracingContextManager.startActiveSpan.mock.calls.find(
          (call) => call[0] === "buffer.append",
        );
      const takeAllCall =
        mockTracingContextManager.startActiveSpan.mock.calls.find(
          (call) => call[0] === "buffer.takeAll",
        );

      expect(appendCall?.[1]).toMatchObject({ kind: "INTERNAL" });
      expect(takeAllCall?.[1]).toMatchObject({ kind: "INTERNAL" });
    });

    it("should include buffer type in append span attributes", async () => {
      const tracedBuffer = createTracedBuffer(dependencies);

      mockTracingContextManager.startActiveSpan.mockImplementation(
        async (name, options, fn) => {
          return fn({
            end: vi.fn(),
            recordException: vi.fn(),
            setStatus: vi.fn(),
          });
        },
      );

      await tracedBuffer.append(testItems);

      expect(mockTracingContextManager.startActiveSpan).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({}),
        expect.any(Function),
      );
    });
  });

  describe("returned buffer interface", () => {
    it("should return an object with append and takeAll methods", () => {
      const tracedBuffer = createTracedBuffer(dependencies);

      expect(tracedBuffer).toHaveProperty("append");
      expect(tracedBuffer).toHaveProperty("takeAll");
      expect(typeof tracedBuffer.append).toBe("function");
      expect(typeof tracedBuffer.takeAll).toBe("function");
    });

    it("should maintain method signatures", async () => {
      const tracedBuffer = createTracedBuffer(dependencies);

      mockTracingContextManager.startActiveSpan.mockImplementation(
        async (name, options, fn) => {
          return fn({
            end: vi.fn(),
            recordException: vi.fn(),
            setStatus: vi.fn(),
          });
        },
      );

      const appendResult = tracedBuffer.append(testItems);
      expect(appendResult).toBeInstanceOf(Promise);

      mockBuffer.takeAll.mockResolvedValue(testItems);
      const takeAllResult = await tracedBuffer.takeAll();
      expect(Array.isArray(takeAllResult)).toBe(true);
    });
  });

  describe("error preservation", () => {
    it("should preserve original error when append fails", async () => {
      const tracedBuffer = createTracedBuffer(dependencies);
      const originalError = new Error("Original append error");
      originalError.name = "BufferAppendError";

      mockBuffer.append.mockRejectedValue(originalError);

      mockTracingContextManager.startActiveSpan.mockImplementation(
        async (name, options, fn) => {
          return await fn({
            end: vi.fn(),
            recordException: vi.fn(),
            setStatus: vi.fn(),
          });
        },
      );

      await expect(tracedBuffer.append(testItems)).rejects.toMatchObject({
        message: "Original append error",
        name: "BufferAppendError",
      });
    });

    it("should preserve original error when takeAll fails", async () => {
      const tracedBuffer = createTracedBuffer(dependencies);
      const originalError = new Error("Original takeAll error");
      originalError.name = "TakeAllError";

      mockBuffer.takeAll.mockRejectedValue(originalError);

      mockTracingContextManager.startActiveSpan.mockImplementation(
        async (name, options, fn) => {
          return await fn({
            end: vi.fn(),
            recordException: vi.fn(),
            setStatus: vi.fn(),
          });
        },
      );

      await expect(tracedBuffer.takeAll()).rejects.toMatchObject({
        message: "Original takeAll error",
        name: "TakeAllError",
      });
    });
  });
});
