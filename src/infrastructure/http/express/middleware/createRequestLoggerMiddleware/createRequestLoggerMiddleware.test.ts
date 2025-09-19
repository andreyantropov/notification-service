import { Request, Response } from "express";
import { describe, it, expect, vi, beforeEach } from "vitest";

import { createRequestLoggerMiddleware } from "./createRequestLoggerMiddleware.js";
import { EventType } from "../../../../../shared/enums/EventType.js";
import { LogLevel } from "../../../../../shared/enums/LogLevel.js";

describe("RequestLoggerMiddleware", () => {
  const mockWriteLog = vi.fn();

  const mockLogger = {
    writeLog: mockWriteLog,
  };

  const middleware = createRequestLoggerMiddleware({
    loggerAdapter: mockLogger,
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should call next()", async () => {
    const req = {
      method: "GET",
      url: "/test",
      ip: "127.0.0.1",
      get: vi.fn().mockReturnValue(null),
      body: {},
    } as unknown as Request;

    const res = {
      statusCode: 200,
      on: vi.fn(),
      get: req.get,
    } as unknown as Response;

    const next = vi.fn();

    middleware(req, res, next);

    expect(next).toHaveBeenCalled();
  });

  it("should log success request with correct fields", async () => {
    const req = {
      method: "POST",
      url: "/api/test",
      ip: "192.168.1.1",
      get: vi.fn((header) =>
        header === "User-Agent" ? "TestAgent" : undefined,
      ),
      body: { foo: "bar" },
    } as unknown as Request;

    const res = {
      statusCode: 201,
      on: vi.fn((event, callback) => {
        if (event === "finish") callback();
      }),
      get: req.get,
    } as unknown as Response;

    const next = vi.fn();

    middleware(req, res, next);

    expect(mockWriteLog).toHaveBeenCalledWith({
      level: LogLevel.Info,
      message: "POST /api/test",
      eventType: EventType.RequestSuccess,
      spanId: "POST /api/test",
      payload: {
        method: "POST",
        url: "/api/test",
        statusCode: 201,
        durationMs: expect.any(Number),
        ip: "192.168.1.1",
        userAgent: "TestAgent",
        body: { foo: "bar" },
      },
    });
  });

  it("should log error request with correct fields", async () => {
    const req = {
      method: "GET",
      url: "/api/fail",
      ip: "10.0.0.1",
      get: vi.fn().mockReturnValue("Mozilla"),
      body: {},
    } as unknown as Request;

    const res = {
      statusCode: 500,
      on: vi.fn((event, callback) => {
        if (event === "finish") callback();
      }),
      get: req.get,
    } as unknown as Response;

    const next = vi.fn();

    middleware(req, res, next);

    expect(mockWriteLog).toHaveBeenCalledWith({
      level: LogLevel.Error,
      message: "GET /api/fail",
      eventType: EventType.RequestError,
      spanId: "GET /api/fail",
      payload: {
        method: "GET",
        url: "/api/fail",
        statusCode: 500,
        durationMs: expect.any(Number),
        ip: "10.0.0.1",
        userAgent: "Mozilla",
        body: {},
      },
    });
  });

  it("should handle missing User-Agent header", async () => {
    const req = {
      method: "GET",
      url: "/api/test",
      ip: "127.0.0.1",
      get: vi.fn().mockReturnValue(undefined),
      body: {},
    } as unknown as Request;

    const res = {
      statusCode: 200,
      on: vi.fn((event, callback) => {
        if (event === "finish") callback();
      }),
      get: req.get,
    } as unknown as Response;

    const next = vi.fn();

    middleware(req, res, next);

    expect(mockWriteLog).toHaveBeenCalledWith(
      expect.objectContaining({
        payload: expect.objectContaining({
          userAgent: null,
        }),
      }),
    );
  });
});
