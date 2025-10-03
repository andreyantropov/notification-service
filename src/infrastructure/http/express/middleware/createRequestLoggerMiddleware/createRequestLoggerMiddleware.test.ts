import { Request, Response } from "express";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

import { createRequestLoggerMiddleware } from "./createRequestLoggerMiddleware.js";
import { EventType } from "../../../../../shared/enums/EventType.js";

describe("RequestLoggerMiddleware", () => {
  const mockLogger = {
    debug: vi.fn(),
    info: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
    critical: vi.fn(),
  };

  const middleware = createRequestLoggerMiddleware({
    loggerAdapter: mockLogger,
  });

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should call next()", () => {
    const req = {
      method: "GET",
      url: "/test",
      ip: "127.0.0.1",
      get: vi.fn().mockReturnValue(null),
    } as unknown as Request;

    const res = {
      statusCode: 200,
      on: vi.fn(),
      headersSent: false,
    } as unknown as Response;

    const next = vi.fn();

    middleware(req, res, next);

    expect(next).toHaveBeenCalled();
  });

  it("should log success request with correct fields", () => {
    const mockFinishCallback = vi.fn();
    const req = {
      method: "POST",
      url: "/api/test",
      ip: "192.168.1.1",
      get: vi.fn((header: string) =>
        header === "User-Agent" ? "TestAgent" : undefined,
      ),
    } as unknown as Request;

    const res = {
      statusCode: 201,
      on: vi.fn((event: string, callback: () => void) => {
        if (event === "finish") {
          mockFinishCallback.mockImplementation(callback);
        }
      }),
      headersSent: true,
    } as unknown as Response;

    const next = vi.fn();

    const startTime = Date.now();
    vi.setSystemTime(startTime);

    middleware(req, res, next);

    vi.setSystemTime(startTime + 150);

    mockFinishCallback();

    expect(mockLogger.info).toHaveBeenCalledWith({
      message: "Запрос POST /api/test обработан",
      eventType: EventType.Request,
      duration: 150,
      details: {
        method: "POST",
        url: "/api/test",
        statusCode: 201,
        ip: "192.168.1.1",
        userAgent: "TestAgent",
      },
    });
  });

  it("should log error request with correct fields", () => {
    const mockFinishCallback = vi.fn();
    const req = {
      method: "GET",
      url: "/api/fail",
      ip: "10.0.0.1",
      get: vi.fn().mockReturnValue("Mozilla"),
    } as unknown as Request;

    const res = {
      statusCode: 500,
      on: vi.fn((event: string, callback: () => void) => {
        if (event === "finish") {
          mockFinishCallback.mockImplementation(callback);
        }
      }),
      headersSent: true,
    } as unknown as Response;

    const next = vi.fn();

    const startTime = Date.now();
    vi.setSystemTime(startTime);

    middleware(req, res, next);

    vi.setSystemTime(startTime + 200);

    mockFinishCallback();

    expect(mockLogger.error).toHaveBeenCalledWith({
      message: "Не удалось обработать запрос GET /api/fail",
      eventType: EventType.Request,
      duration: 200,
      details: {
        method: "GET",
        url: "/api/fail",
        statusCode: 500,
        ip: "10.0.0.1",
        userAgent: "Mozilla",
      },
    });
  });

  it("should log warning when connection is closed before response is sent", () => {
    const mockCloseCallback = vi.fn();
    const req = {
      method: "GET",
      url: "/api/test",
      ip: "127.0.0.1",
      get: vi.fn().mockReturnValue(undefined),
    } as unknown as Request;

    const res = {
      statusCode: 200,
      on: vi.fn((event: string, callback: () => void) => {
        if (event === "close") {
          mockCloseCallback.mockImplementation(callback);
        }
      }),
      headersSent: false,
    } as unknown as Response;

    const next = vi.fn();

    const startTime = Date.now();
    vi.setSystemTime(startTime);

    middleware(req, res, next);

    vi.setSystemTime(startTime + 100);

    mockCloseCallback();

    expect(mockLogger.warning).toHaveBeenCalledWith({
      message:
        "Запрос GET /api/test был прерван клиентом до завершения обработки",
      eventType: EventType.Request,
      duration: 100,
      details: {
        method: "GET",
        url: "/api/test",
        statusCode: 200,
        ip: "127.0.0.1",
        userAgent: "-",
      },
    });
  });

  it("should not log warning on close if headers were sent", () => {
    const mockCloseCallback = vi.fn();
    const req = {
      method: "GET",
      url: "/api/test",
      ip: "127.0.0.1",
      get: vi.fn().mockReturnValue(undefined),
    } as unknown as Request;

    const res = {
      statusCode: 200,
      on: vi.fn((event: string, callback: () => void) => {
        if (event === "close") {
          mockCloseCallback.mockImplementation(callback);
        }
      }),
      headersSent: true,
    } as unknown as Response;

    const next = vi.fn();

    middleware(req, res, next);

    mockCloseCallback();

    expect(mockLogger.warning).not.toHaveBeenCalled();
  });

  it("should handle missing User-Agent header", () => {
    const mockFinishCallback = vi.fn();
    const req = {
      method: "GET",
      url: "/api/test",
      ip: "127.0.0.1",
      get: vi.fn().mockReturnValue(undefined),
    } as unknown as Request;

    const res = {
      statusCode: 200,
      on: vi.fn((event: string, callback: () => void) => {
        if (event === "finish") {
          mockFinishCallback.mockImplementation(callback);
        }
      }),
      headersSent: true,
    } as unknown as Response;

    const next = vi.fn();

    const startTime = Date.now();
    vi.setSystemTime(startTime);

    middleware(req, res, next);

    vi.setSystemTime(startTime + 50);

    mockFinishCallback();

    expect(mockLogger.info).toHaveBeenCalledWith(
      expect.objectContaining({
        details: expect.objectContaining({
          userAgent: "-",
        }),
      }),
    );
  });

  it("should log 400 status as success (since it's client error)", () => {
    const mockFinishCallback = vi.fn();
    const req = {
      method: "POST",
      url: "/api/bad-request",
      ip: "192.168.1.1",
      get: vi.fn().mockReturnValue("TestAgent"),
    } as unknown as Request;

    const res = {
      statusCode: 400,
      on: vi.fn((event: string, callback: () => void) => {
        if (event === "finish") {
          mockFinishCallback.mockImplementation(callback);
        }
      }),
      headersSent: true,
    } as unknown as Response;

    const next = vi.fn();

    const startTime = Date.now();
    vi.setSystemTime(startTime);

    middleware(req, res, next);

    vi.setSystemTime(startTime + 75);

    mockFinishCallback();

    expect(mockLogger.info).toHaveBeenCalled();
    expect(mockLogger.error).not.toHaveBeenCalled();
  });

  it("should log 499 status as warning for closed connection", () => {
    const mockCloseCallback = vi.fn();
    const req = {
      method: "GET",
      url: "/api/test",
      ip: "127.0.0.1",
      get: vi.fn().mockReturnValue(undefined),
    } as unknown as Request;

    const res = {
      statusCode: 499,
      on: vi.fn((event: string, callback: () => void) => {
        if (event === "close") {
          mockCloseCallback.mockImplementation(callback);
        }
      }),
      headersSent: false,
    } as unknown as Response;

    const next = vi.fn();

    const startTime = Date.now();
    vi.setSystemTime(startTime);

    middleware(req, res, next);

    vi.setSystemTime(startTime + 80);

    mockCloseCallback();

    expect(mockLogger.warning).toHaveBeenCalled();
  });

  it("should log 300 status as success", () => {
    const mockFinishCallback = vi.fn();
    const req = {
      method: "GET",
      url: "/api/redirect",
      ip: "192.168.1.1",
      get: vi.fn().mockReturnValue("TestAgent"),
    } as unknown as Request;

    const res = {
      statusCode: 301,
      on: vi.fn((event: string, callback: () => void) => {
        if (event === "finish") {
          mockFinishCallback.mockImplementation(callback);
        }
      }),
      headersSent: true,
    } as unknown as Response;

    const next = vi.fn();

    const startTime = Date.now();
    vi.setSystemTime(startTime);

    middleware(req, res, next);

    vi.setSystemTime(startTime + 60);

    mockFinishCallback();

    expect(mockLogger.info).toHaveBeenCalled();
    expect(mockLogger.error).not.toHaveBeenCalled();
  });
});
