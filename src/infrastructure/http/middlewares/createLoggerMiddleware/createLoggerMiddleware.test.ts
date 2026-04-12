import { EventEmitter } from "events";

import { type NextFunction, type Request, type Response } from "express";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  EVENT_TYPE,
  type Logger,
  TRIGGER_TYPE,
} from "../../../telemetry/index.js";

import { ABORTED_STATUS_CODE } from "./constants/index.js";
import { createLoggerMiddleware } from "./createLoggerMiddleware.js";
import { type LoggerMiddlewareDependencies } from "./interfaces/index.js";

type MockResponse = Response &
  EventEmitter & {
    statusMessage?: string;
    headersSent: boolean;
  };

describe("createLoggerMiddleware", () => {
  let mockLogger: Logger;
  let mockReq: Partial<Request>;
  let mockRes: MockResponse;
  let next: NextFunction;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();

    mockLogger = {
      debug: vi.fn().mockResolvedValue(undefined),
      info: vi.fn().mockResolvedValue(undefined),
      warn: vi.fn().mockResolvedValue(undefined),
      error: vi.fn().mockResolvedValue(undefined),
    };

    mockReq = {
      method: "GET",
      url: "/test",
      ip: "127.0.0.1",
      get: vi.fn().mockReturnValue("Mozilla/5.0"),
    };

    const resEmitter = new EventEmitter();
    mockRes = Object.assign(resEmitter, {
      statusCode: 200,
      statusMessage: "OK",
      headersSent: false,
    }) as unknown as MockResponse;

    next = vi.fn();
  });

  it("should call next() immediately", () => {
    const dependencies: LoggerMiddlewareDependencies = { logger: mockLogger };
    const middleware = createLoggerMiddleware(dependencies);

    middleware(mockReq as Request, mockRes as Response, next);

    expect(next).toHaveBeenCalledTimes(1);
  });

  it("should log debug when status code is 200 on finish", () => {
    const dependencies: LoggerMiddlewareDependencies = { logger: mockLogger };
    const middleware = createLoggerMiddleware(dependencies);
    middleware(mockReq as Request, mockRes as Response, next);

    vi.advanceTimersByTime(150);
    mockRes.emit("finish");

    expect(mockLogger.debug).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "HTTP-запрос завершен",
        durationMs: 150,
        eventType: EVENT_TYPE.REQUEST,
        trigger: TRIGGER_TYPE.API,
        details: expect.objectContaining({
          method: "GET",
          statusCode: 200,
          userAgent: "Mozilla/5.0",
        }),
      }),
    );
  });

  it("should log warn when status code is 403", () => {
    const dependencies: LoggerMiddlewareDependencies = { logger: mockLogger };
    const middleware = createLoggerMiddleware(dependencies);
    mockRes.statusCode = 403;

    middleware(mockReq as Request, mockRes as Response, next);
    mockRes.emit("finish");

    expect(mockLogger.warn).toHaveBeenCalledWith(
      expect.objectContaining({
        details: expect.objectContaining({ statusCode: 403 }),
      }),
    );
  });

  it("should log error when status code is 500", () => {
    const dependencies: LoggerMiddlewareDependencies = { logger: mockLogger };
    const middleware = createLoggerMiddleware(dependencies);
    mockRes.statusCode = 500;

    middleware(mockReq as Request, mockRes as Response, next);
    mockRes.emit("finish");

    expect(mockLogger.error).toHaveBeenCalledWith(
      expect.objectContaining({
        details: expect.objectContaining({ statusCode: 500 }),
      }),
    );
  });

  it("should log client abort on 'close' event if headers were not sent", () => {
    const dependencies: LoggerMiddlewareDependencies = { logger: mockLogger };
    const middleware = createLoggerMiddleware(dependencies);
    mockRes.headersSent = false;

    middleware(mockReq as Request, mockRes as Response, next);
    vi.advanceTimersByTime(50);
    mockRes.emit("close");

    expect(mockLogger.warn).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "Запрос был прерван клиентом до завершения обработки",
        durationMs: 50,
        details: expect.objectContaining({
          statusCode: ABORTED_STATUS_CODE,
        }),
      }),
    );
  });

  it("should not log abort on 'close' if headers were already sent", () => {
    const dependencies: LoggerMiddlewareDependencies = { logger: mockLogger };
    const middleware = createLoggerMiddleware(dependencies);
    mockRes.headersSent = true;

    middleware(mockReq as Request, mockRes as Response, next);
    mockRes.emit("close");

    expect(mockLogger.warn).not.toHaveBeenCalled();
  });

  it("should handle missing User-Agent gracefully", () => {
    const dependencies: LoggerMiddlewareDependencies = { logger: mockLogger };
    const middleware = createLoggerMiddleware(dependencies);

    if (mockReq.get) {
      vi.mocked(mockReq.get).mockReturnValue(undefined);
    }

    middleware(mockReq as Request, mockRes as Response, next);
    mockRes.emit("finish");

    const [firstCall] = vi.mocked(mockLogger.debug).mock.calls;
    const logData = firstCall[0] as { details: Record<string, unknown> };

    expect(logData.details).not.toHaveProperty("userAgent");
  });
});
