import type { Request, Response } from "express";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

import { createRequestLoggerMiddleware } from "./createRequestLoggerMiddleware.js";
import { EventType } from "../../../../../application/enums/index.js";

describe("RequestLoggerMiddleware", () => {
  const mockLogger = {
    debug: vi.fn(),
    info: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
    critical: vi.fn(),
  };

  const middleware = createRequestLoggerMiddleware({
    logger: mockLogger,
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
      durationMs: 150,
      details: {
        method: "POST",
        url: "/api/test",
        statusCode: 201,
        ip: "192.168.1.1",
        userAgent: "TestAgent",
      },
    });
  });

  it("should log 401 as AuthAttempt with info level", () => {
    const mockFinishCallback = vi.fn();
    const req = {
      method: "GET",
      url: "/api/protected",
      ip: "192.168.1.1",
      get: vi.fn().mockReturnValue("TestAgent"),
    } as unknown as Request;

    const res = {
      statusCode: 401,
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

    vi.setSystemTime(startTime + 100);

    mockFinishCallback();

    expect(mockLogger.info).toHaveBeenCalledWith({
      message: "Требуется аутентификация: GET /api/protected",
      eventType: EventType.AuthAttempt,
      durationMs: 100,
      details: {
        method: "GET",
        url: "/api/protected",
        statusCode: 401,
        ip: "192.168.1.1",
        userAgent: "TestAgent",
      },
    });
  });

  it("should log 403 as AccessDenied with info level", () => {
    const mockFinishCallback = vi.fn();
    const req = {
      method: "POST",
      url: "/api/admin",
      ip: "192.168.1.1",
      get: vi.fn().mockReturnValue("TestAgent"),
    } as unknown as Request;

    const res = {
      statusCode: 403,
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

    vi.setSystemTime(startTime + 120);

    mockFinishCallback();

    expect(mockLogger.info).toHaveBeenCalledWith({
      message: "Доступ запрещен: POST /api/admin",
      eventType: EventType.AccessDenied,
      durationMs: 120,
      details: {
        method: "POST",
        url: "/api/admin",
        statusCode: 403,
        ip: "192.168.1.1",
        userAgent: "TestAgent",
      },
    });
  });

  it("should log 404 with custom message and info level", () => {
    const mockFinishCallback = vi.fn();
    const req = {
      method: "GET",
      url: "/api/not-found",
      ip: "192.168.1.1",
      get: vi.fn().mockReturnValue("TestAgent"),
    } as unknown as Request;

    const res = {
      statusCode: 404,
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

    vi.setSystemTime(startTime + 80);

    mockFinishCallback();

    expect(mockLogger.info).toHaveBeenCalledWith({
      message: "Ресурс не найден: GET /api/not-found",
      eventType: EventType.Request,
      durationMs: 80,
      details: {
        method: "GET",
        url: "/api/not-found",
        statusCode: 404,
        ip: "192.168.1.1",
        userAgent: "TestAgent",
      },
    });
  });

  it("should log 429 with custom message and info level", () => {
    const mockFinishCallback = vi.fn();
    const req = {
      method: "POST",
      url: "/api/rate-limited",
      ip: "192.168.1.1",
      get: vi.fn().mockReturnValue("TestAgent"),
    } as unknown as Request;

    const res = {
      statusCode: 429,
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

    vi.setSystemTime(startTime + 90);

    mockFinishCallback();

    expect(mockLogger.info).toHaveBeenCalledWith({
      message: "Слишком много запросов: POST /api/rate-limited",
      eventType: EventType.Request,
      durationMs: 90,
      details: {
        method: "POST",
        url: "/api/rate-limited",
        statusCode: 429,
        ip: "192.168.1.1",
        userAgent: "TestAgent",
      },
    });
  });

  it("should log 500 as error with custom message", () => {
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
      message: "Серверная ошибка: GET /api/fail",
      eventType: EventType.Request,
      durationMs: 200,
      details: {
        method: "GET",
        url: "/api/fail",
        statusCode: 500,
        ip: "10.0.0.1",
        userAgent: "Mozilla",
      },
    });
  });

  it("should log 502 as error with custom message", () => {
    const mockFinishCallback = vi.fn();
    const req = {
      method: "GET",
      url: "/api/gateway",
      ip: "10.0.0.1",
      get: vi.fn().mockReturnValue("Mozilla"),
    } as unknown as Request;

    const res = {
      statusCode: 502,
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

    vi.setSystemTime(startTime + 250);

    mockFinishCallback();

    expect(mockLogger.error).toHaveBeenCalledWith({
      message: "Серверная ошибка: GET /api/gateway",
      eventType: EventType.Request,
      durationMs: 250,
      details: {
        method: "GET",
        url: "/api/gateway",
        statusCode: 502,
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
      durationMs: 100,
      details: {
        method: "GET",
        url: "/api/test",
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

  it("should log 400 status as info (client error)", () => {
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

  it("should log 300 status as info", () => {
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
