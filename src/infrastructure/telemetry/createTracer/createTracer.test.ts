import {
  context,
  SpanKind as OtelSpanKind,
  propagation,
  type Span,
  SpanStatusCode,
  trace,
} from "@opentelemetry/api";
import { beforeEach, describe, expect, it, type Mock, vi } from "vitest";

import { createTracer } from "./createTracer.js";

vi.mock("@opentelemetry/api", () => ({
  trace: {
    getTracer: vi.fn(),
  },
  context: {
    active: vi.fn(),
    with: vi.fn((ctx, fn) => fn()),
  },
  propagation: {
    extract: vi.fn(),
    inject: vi.fn(),
  },
  SpanStatusCode: {
    OK: 1,
    ERROR: 2,
  },
  SpanKind: {
    INTERNAL: 0,
    SERVER: 1,
    CLIENT: 2,
    PRODUCER: 3,
    CONSUMER: 4,
  },
}));

vi.mock("../utils/index.js", () => ({
  mapKeysToSnakeCase: vi.fn((obj) => obj),
}));

describe("Tracer Factory", () => {
  const serviceName = "test-service";
  const mockSpan = {
    setStatus: vi.fn(),
    recordException: vi.fn(),
    end: vi.fn(),
  } as unknown as Span;

  const mockTracer = {
    startActiveSpan: vi.fn((name, options, cb) => cb(mockSpan)),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (trace.getTracer as Mock).mockReturnValue(mockTracer);
  });

  describe("startActiveSpan", () => {
    it("should successfully execute the function and set OK status", async () => {
      const tracer = createTracer({ serviceName });
      const work = vi.fn().mockResolvedValue("success");

      const result = await tracer.startActiveSpan("test-span", work, {
        kind: "SERVER",
        attributes: { userId: "123" },
      });

      expect(result).toBe("success");
      expect(mockTracer.startActiveSpan).toHaveBeenCalledWith(
        "test-span",
        expect.objectContaining({ kind: OtelSpanKind.SERVER }),
        expect.any(Function),
      );
      expect(mockSpan.setStatus).toHaveBeenCalledWith({
        code: SpanStatusCode.OK,
      });
      expect(mockSpan.end).toHaveBeenCalled();
    });

    it("should record exception and throw error if the function fails", async () => {
      const tracer = createTracer({ serviceName });
      const error = new Error("failure");
      const work = vi.fn().mockRejectedValue(error);

      await expect(tracer.startActiveSpan("fail-span", work)).rejects.toThrow(
        "failure",
      );

      expect(mockSpan.recordException).toHaveBeenCalledWith(error);
      expect(mockSpan.setStatus).toHaveBeenCalledWith({
        code: SpanStatusCode.ERROR,
        message: "failure",
      });
      expect(mockSpan.end).toHaveBeenCalled();
    });

    it("should wrap non-error objects into Error instance when failing", async () => {
      const tracer = createTracer({ serviceName });
      const work = vi.fn().mockRejectedValue("string error");

      await expect(tracer.startActiveSpan("fail-span", work)).rejects.toBe(
        "string error",
      );

      expect(mockSpan.recordException).toHaveBeenCalledWith(expect.any(Error));
      expect(mockSpan.setStatus).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "string error",
        }),
      );
    });
  });

  describe("continueTrace", () => {
    it("should extract context from headers and run function within it", async () => {
      const tracer = createTracer({ serviceName });
      const headers = { traceparent: "00-abc-123-01" };
      const mockContext = { hi: "there" };

      (propagation.extract as Mock).mockReturnValue(mockContext);

      await tracer.continueTrace(headers, async () => {
        expect(context.with).toHaveBeenCalledWith(
          mockContext,
          expect.any(Function),
        );
      });
    });
  });

  describe("getTraceHeaders", () => {
    it("should inject current context into a carrier object", () => {
      const tracer = createTracer({ serviceName });
      const activeCtx = { active: true };
      (context.active as Mock).mockReturnValue(activeCtx);

      (propagation.inject as Mock).mockImplementation((ctx, carrier) => {
        carrier["injected"] = "true";
      });

      const headers = tracer.getTraceHeaders();

      expect(headers).toEqual({ injected: "true" });
      expect(propagation.inject).toHaveBeenCalledWith(
        activeCtx,
        expect.any(Object),
      );
    });
  });
});
