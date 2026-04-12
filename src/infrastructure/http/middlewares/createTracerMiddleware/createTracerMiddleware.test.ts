import { type NextFunction, type Request, type Response } from "express";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { SPAN_KIND, type Tracer } from "../../../telemetry/index.js";

import { createTracerMiddleware } from "./createTracerMiddleware.js";
import { type TracerMiddlewareDependencies } from "./interfaces/index.js";

interface MockRoute {
  path: string;
}

describe("createTracerMiddleware", () => {
  let mockTracer: Tracer;
  let mockReq: Partial<Request & { route?: MockRoute }>;
  let mockRes: Partial<Response>;
  let next: NextFunction;

  beforeEach(() => {
    vi.clearAllMocks();

    mockTracer = {
      continueTrace: vi.fn().mockImplementation((_headers, fn) => fn()),
      startActiveSpan: vi.fn().mockImplementation((_name, fn) => fn()),
      getTraceHeaders: vi.fn().mockReturnValue({}),
    };

    mockReq = {
      method: "POST",
      path: "/api/test",
      originalUrl: "/api/test?query=1",
      protocol: "https",
      host: "localhost",
      ip: "127.0.0.1",
      headers: {},
      get: vi.fn().mockReturnValue("Vitest-Agent"),
      route: { path: "/api/:id" },
    };

    mockRes = {};

    next = vi.fn((cb?: (err?: unknown) => void) => {
      if (typeof cb === "function") cb();
    }) as unknown as NextFunction;
  });

  const getDeps = (): TracerMiddlewareDependencies => ({ tracer: mockTracer });

  it("should extract trace headers and call continueTrace", async () => {
    const traceparent = "00-test-trace-id-01";
    const tracestate = "test-state";
    if (mockReq.headers) {
      mockReq.headers = { traceparent, tracestate };
    }

    const middleware = createTracerMiddleware(getDeps());
    await middleware(mockReq as Request, mockRes as Response, next);

    expect(mockTracer.continueTrace).toHaveBeenCalledWith(
      { traceparent, tracestate },
      expect.any(Function),
    );
  });

  it("should start active span with correct name and attributes", async () => {
    const middleware = createTracerMiddleware(getDeps());
    await middleware(mockReq as Request, mockRes as Response, next);

    expect(mockTracer.startActiveSpan).toHaveBeenCalledWith(
      "POST /api/:id",
      expect.any(Function),
      {
        kind: SPAN_KIND.SERVER,
        attributes: {
          "http.method": "POST",
          "http.url": "/api/test?query=1",
          "http.scheme": "https",
          "http.host": "localhost",
          "net.peer.ip": "127.0.0.1",
          "http.user_agent": "Vitest-Agent",
          "http.route": "/api/:id",
        },
      },
    );
  });

  it("should fallback to req.path if req.route.path is missing", async () => {
    mockReq.route = undefined;
    const middleware = createTracerMiddleware(getDeps());
    await middleware(mockReq as Request, mockRes as Response, next);

    expect(mockTracer.startActiveSpan).toHaveBeenCalledWith(
      "POST /api/test",
      expect.any(Function),
      expect.objectContaining({ kind: SPAN_KIND.SERVER }),
    );
  });

  it("should call next() and resolve when no error occurs", async () => {
    const middleware = createTracerMiddleware(getDeps());
    await middleware(mockReq as Request, mockRes as Response, next);

    expect(next).toHaveBeenCalled();
  });

  it("should reject when next() is called with an error", async () => {
    const testError = new Error("Middleware Error");
    const nextWithError = vi.fn((cb: (err?: unknown) => void) => {
      cb(testError);
    }) as unknown as NextFunction;

    const middleware = createTracerMiddleware(getDeps());

    await expect(
      middleware(mockReq as Request, mockRes as Response, nextWithError),
    ).rejects.toThrow("Middleware Error");
  });
});
