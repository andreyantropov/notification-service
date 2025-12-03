import { trace } from "@opentelemetry/api";
import { describe, it, expect, vi, beforeEach } from "vitest";

import { createTracer } from "./createTracer.js";
import { TracerConfig } from "./interfaces/index.js";
import { Tracer } from "../../../application/ports/index.js";
import { CHANNEL_TYPES } from "../../../domain/types/index.js";
import {
  mapKeysToSnakeCase,
  toSnakeCase,
} from "../../../shared/utils/index.js";

const mockOtelSpan = {
  recordException: vi.fn(),
  setStatus: vi.fn(),
  end: vi.fn(),
};

const mockTracer = {
  startActiveSpan: vi.fn((name, options, callback) => {
    return callback(mockOtelSpan);
  }),
};

vi.mock("@opentelemetry/api", () => ({
  trace: {
    getTracer: vi.fn(() => mockTracer),
  },
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

describe("createTracer", () => {
  let config: TracerConfig;
  let tracer: Tracer;

  beforeEach(() => {
    config = { serviceName: "test-service" };
    vi.clearAllMocks();
    tracer = createTracer(config);
  });

  it("should get tracer with correct service name", () => {
    expect(trace.getTracer).toHaveBeenCalledWith("test-service");
  });

  describe("startActiveSpan", () => {
    it("should start span with default INTERNAL kind when no kind specified", async () => {
      const fn = vi.fn().mockResolvedValue("result");
      await tracer.startActiveSpan("test-span", {}, fn);

      expect(mockTracer.startActiveSpan).toHaveBeenCalledWith(
        toSnakeCase("test-span"),
        {
          kind: 3,
          attributes: mapKeysToSnakeCase(undefined),
        },
        expect.any(Function),
      );
      expect(fn).toHaveBeenCalledOnce();
    });

    it("should start span with specified kind and attributes, applying transformations", async () => {
      const fn = vi.fn().mockResolvedValue("result");
      const originalAttributes = {
        channelType: CHANNEL_TYPES.EMAIL,
        contactType: "user@example.com",
      };
      const originalName = "sendEmail";

      await tracer.startActiveSpan(
        originalName,
        { kind: "CLIENT", attributes: originalAttributes },
        fn,
      );

      expect(mockTracer.startActiveSpan).toHaveBeenCalledWith(
        toSnakeCase(originalName),
        {
          kind: 2,
          attributes: mapKeysToSnakeCase(originalAttributes),
        },
        expect.any(Function),
      );
    });

    it("should map all span kinds correctly", async () => {
      const fn = vi.fn().mockResolvedValue("ok");
      const kinds = [
        "SERVER",
        "CLIENT",
        "INTERNAL",
        "PRODUCER",
        "CONSUMER",
      ] as const;
      const expectedKinds = [1, 2, 3, 4, 5];

      for (let i = 0; i < kinds.length; i++) {
        vi.clearAllMocks();
        await tracer.startActiveSpan("test", { kind: kinds[i] }, fn);
        expect(mockTracer.startActiveSpan).toHaveBeenCalledWith(
          "test",
          expect.objectContaining({ kind: expectedKinds[i] }),
          expect.any(Function),
        );
      }
    });

    it("should wrap OTel span and expose recordException and setStatus", async () => {
      const fn = vi.fn().mockImplementation((span) => {
        span.recordException(new Error("test"));
        span.setStatus({ code: "OK" });
        return Promise.resolve("done");
      });

      await tracer.startActiveSpan("test", {}, fn);

      expect(mockOtelSpan.recordException).toHaveBeenCalledWith(
        new Error("test"),
      );
      expect(mockOtelSpan.setStatus).toHaveBeenCalledWith({
        code: 1,
        message: undefined,
      });
    });

    it("should catch errors, record them, and rethrow", async () => {
      const error = new Error("Boom!");
      const fn = vi.fn().mockRejectedValue(error);

      await expect(tracer.startActiveSpan("test", {}, fn)).rejects.toThrow(
        "Boom!",
      );
      expect(mockOtelSpan.recordException).toHaveBeenCalledWith(error);
      expect(mockOtelSpan.setStatus).toHaveBeenCalledWith({
        code: 2,
        message: "Boom!",
      });
    });

    it("should handle non-Error thrown values", async () => {
      const fn = vi.fn().mockRejectedValue("string error");
      await expect(tracer.startActiveSpan("test", {}, fn)).rejects.toBe(
        "string error",
      );
      expect(mockOtelSpan.recordException).toHaveBeenCalledWith("string error");
      expect(mockOtelSpan.setStatus).toHaveBeenCalledWith({
        code: 2,
        message: "string error",
      });
    });

    it("should return the result of the wrapped function", async () => {
      const result = { success: true };
      const fn = vi.fn().mockResolvedValue(result);
      const output = await tracer.startActiveSpan("test", {}, fn);
      expect(output).toBe(result);
    });
  });
});
