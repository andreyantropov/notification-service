import { SpanKind, SpanStatusCode } from "@opentelemetry/api";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

import { createTracingContextManager } from "./createTracingContextManager.js";
import { TracingContextManagerConfig } from "./interfaces/TracingContextManagerConfig.js";
import { TracingContextManager } from "../../../../ports/TracingContextManager.js";

const { mockTracerInstance, mockContext, mockTrace } = vi.hoisted(() => {
  const mockTracerInstance = {
    startActiveSpan: vi.fn(),
  };

  const mockContext = {
    active: vi.fn(),
    with: vi.fn(),
  };

  const mockTrace = {
    getTracer: vi.fn(() => mockTracerInstance),
    getSpan: vi.fn(),
  };

  return { mockTracerInstance, mockContext, mockTrace };
});

vi.mock("@opentelemetry/api", () => ({
  trace: mockTrace,
  context: mockContext,
  SpanKind: {
    SERVER: 1,
    CLIENT: 2,
    INTERNAL: 3,
    PRODUCER: 4,
    CONSUMER: 5,
  },
  SpanStatusCode: {
    OK: 1,
    ERROR: 2,
  },
}));

describe("createOtelTracingContextManager", () => {
  let config: TracingContextManagerConfig;
  let manager: TracingContextManager;

  beforeEach(() => {
    config = { serviceName: "test-service" };
    vi.clearAllMocks();
    manager = createTracingContextManager(config);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("constructor", () => {
    it("should create tracer with correct service name", () => {
      expect(mockTrace.getTracer).toHaveBeenCalledWith("test-service");
    });
  });

  describe("active", () => {
    it("should return active context from OpenTelemetry", () => {
      const mockActiveContext = { active: true };
      mockContext.active.mockReturnValue(mockActiveContext as never);

      const result = manager.active();

      expect(mockContext.active).toHaveBeenCalledOnce();
      expect(result).toBe(mockActiveContext);
    });
  });

  describe("with", () => {
    it("should execute function within provided context", async () => {
      const mockContextObj = { context: true };
      const mockFn = vi.fn().mockResolvedValue("test-result");
      mockContext.with.mockImplementation((ctx, fn) => fn() as never);

      const result = await manager.with(mockContextObj, mockFn);

      expect(mockContext.with).toHaveBeenCalledWith(
        mockContextObj,
        expect.any(Function),
      );
      expect(mockFn).toHaveBeenCalledOnce();
      expect(result).toBe("test-result");
    });

    it("should handle errors thrown from function", async () => {
      const mockContextObj = { context: true };
      const testError = new Error("Test error");
      const mockFn = vi.fn().mockRejectedValue(testError);
      mockContext.with.mockImplementation((ctx, fn) => fn() as never);

      await expect(manager.with(mockContextObj, mockFn)).rejects.toThrow(
        "Test error",
      );
    });
  });

  describe("getTraceContext", () => {
    it("should return null when no span exists in context", () => {
      const mockContextObj = { context: true };
      mockTrace.getSpan.mockReturnValue(undefined);

      const result = manager.getTraceContext(mockContextObj);

      expect(mockTrace.getSpan).toHaveBeenCalledWith(mockContextObj);
      expect(result).toBeNull();
    });

    it("should return trace context when span exists", () => {
      const mockContextObj = { context: true };
      const mockSpanContext = {
        traceId: "trace-123",
        spanId: "span-456",
      };
      const mockSpan = {
        spanContext: vi.fn().mockReturnValue(mockSpanContext),
      };
      mockTrace.getSpan.mockReturnValue(mockSpan as never);

      const result = manager.getTraceContext(mockContextObj);

      expect(mockTrace.getSpan).toHaveBeenCalledWith(mockContextObj);
      expect(result).toEqual({
        traceId: "trace-123",
        spanId: "span-456",
      });
    });
  });

  describe("startActiveSpan", () => {
    let mockOtelSpan: {
      recordException: ReturnType<typeof vi.fn>;
      setStatus: ReturnType<typeof vi.fn>;
    };

    beforeEach(() => {
      mockOtelSpan = {
        recordException: vi.fn(),
        setStatus: vi.fn(),
      };
    });

    it("should start span with default INTERNAL kind when no kind specified", async () => {
      const mockFn = vi.fn().mockResolvedValue("success");

      mockTracerInstance.startActiveSpan.mockImplementation(
        (name, options, fn) => {
          return fn(mockOtelSpan);
        },
      );

      const result = await manager.startActiveSpan("test-span", {}, mockFn);

      expect(mockTracerInstance.startActiveSpan).toHaveBeenCalledWith(
        "test-span",
        {
          kind: SpanKind.INTERNAL,
          attributes: undefined,
        },
        expect.any(Function),
      );
      expect(mockFn).toHaveBeenCalledOnce();
      expect(result).toBe("success");
    });

    it("should start span with specified kind and attributes", async () => {
      const mockFn = vi.fn().mockResolvedValue("success");

      mockTracerInstance.startActiveSpan.mockImplementation(
        (name, options, fn) => {
          return fn(mockOtelSpan);
        },
      );

      const attributes = { key: "value", number: 123, bool: true };
      await manager.startActiveSpan(
        "test-span",
        {
          kind: "SERVER",
          attributes,
        },
        mockFn,
      );

      expect(mockTracerInstance.startActiveSpan).toHaveBeenCalledWith(
        "test-span",
        {
          kind: SpanKind.SERVER,
          attributes,
        },
        expect.any(Function),
      );
    });

    it("should map all span kinds correctly", async () => {
      const mockFn = vi.fn().mockResolvedValue("success");

      mockTracerInstance.startActiveSpan.mockImplementation(
        (name, options, fn) => {
          return fn(mockOtelSpan);
        },
      );

      const kinds = [
        "SERVER",
        "CLIENT",
        "INTERNAL",
        "PRODUCER",
        "CONSUMER",
      ] as const;

      for (const kind of kinds) {
        vi.clearAllMocks();
        await manager.startActiveSpan("test-span", { kind }, mockFn);

        expect(mockTracerInstance.startActiveSpan).toHaveBeenCalledWith(
          "test-span",
          expect.objectContaining({
            kind: SpanKind[kind],
          }),
          expect.any(Function),
        );
      }
    });

    it("should record exception and set error status when function throws", async () => {
      const testError = new Error("Test error");
      const mockFn = vi.fn().mockRejectedValue(testError);

      mockTracerInstance.startActiveSpan.mockImplementation(
        (name, options, fn) => {
          return fn(mockOtelSpan);
        },
      );

      await expect(
        manager.startActiveSpan("test-span", {}, mockFn),
      ).rejects.toThrow("Test error");

      expect(mockOtelSpan.recordException).toHaveBeenCalledWith(testError);
      expect(mockOtelSpan.setStatus).toHaveBeenCalledWith({
        code: SpanStatusCode.ERROR,
        message: "Test error",
      });
    });

    it("should provide span wrapper with correct methods", async () => {
      const mockFn = vi.fn().mockImplementation((span) => {
        expect(typeof span.recordException).toBe("function");
        expect(typeof span.setStatus).toBe("function");

        span.recordException(new Error("test"));
        span.setStatus({ code: "OK" });

        return Promise.resolve("success");
      });

      mockTracerInstance.startActiveSpan.mockImplementation(
        (name, options, fn) => {
          return fn(mockOtelSpan);
        },
      );

      await manager.startActiveSpan("test-span", {}, mockFn);

      expect(mockFn).toHaveBeenCalledOnce();
      expect(mockOtelSpan.recordException).toHaveBeenCalledWith(
        new Error("test"),
      );
      expect(mockOtelSpan.setStatus).toHaveBeenCalledWith({
        code: SpanStatusCode.OK,
        message: undefined,
      });
    });

    it("should map status codes correctly in span wrapper", async () => {
      const mockFn = vi.fn().mockImplementation((span) => {
        span.setStatus({ code: "OK" });
        span.setStatus({ code: "ERROR", message: "test error" });
        return Promise.resolve("success");
      });

      mockTracerInstance.startActiveSpan.mockImplementation(
        (name, options, fn) => {
          return fn(mockOtelSpan);
        },
      );

      await manager.startActiveSpan("test-span", {}, mockFn);

      expect(mockOtelSpan.setStatus).toHaveBeenCalledWith({
        code: SpanStatusCode.OK,
        message: undefined,
      });
      expect(mockOtelSpan.setStatus).toHaveBeenCalledWith({
        code: SpanStatusCode.ERROR,
        message: "test error",
      });
    });

    it("should handle non-Error objects in recordException", async () => {
      const nonError = "String error";
      const mockFn = vi.fn().mockRejectedValue(nonError);

      mockTracerInstance.startActiveSpan.mockImplementation(
        (name, options, fn) => {
          return fn(mockOtelSpan);
        },
      );

      await expect(
        manager.startActiveSpan("test-span", {}, mockFn),
      ).rejects.toBe(nonError);

      expect(mockOtelSpan.recordException).toHaveBeenCalledWith(nonError);
      expect(mockOtelSpan.setStatus).toHaveBeenCalledWith({
        code: SpanStatusCode.ERROR,
        message: "String error",
      });
    });

    it("should return the result from the wrapped function", async () => {
      const expectedResult = { data: "test result" };
      const mockFn = vi.fn().mockResolvedValue(expectedResult);

      mockTracerInstance.startActiveSpan.mockImplementation(
        (name, options, fn) => {
          return fn(mockOtelSpan);
        },
      );

      const result = await manager.startActiveSpan("test-span", {}, mockFn);

      expect(result).toBe(expectedResult);
    });
  });
});
