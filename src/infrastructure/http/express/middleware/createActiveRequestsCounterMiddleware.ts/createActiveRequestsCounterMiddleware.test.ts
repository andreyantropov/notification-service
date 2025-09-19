import { NextFunction, Request, Response } from "express";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

import { createActiveRequestsCounterMiddleware } from "./createActiveRequestsCounterMiddleware";
import { Counter } from "../../../../ports/Counter";

describe("createActiveRequestsCounterMiddleware", () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;
  let mockCounter: Counter;

  beforeEach(() => {
    mockRequest = {};
    mockResponse = {
      on: vi.fn(),
    };
    mockNext = vi.fn();
    mockCounter = {
      value: 0,
      increase: vi.fn(),
      decrease: vi.fn(),
    };
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should call increase on the counter when middleware is executed", () => {
    const middleware = createActiveRequestsCounterMiddleware({
      activeRequestsCounter: mockCounter,
    });
    middleware(mockRequest as Request, mockResponse as Response, mockNext);

    expect(mockCounter.increase).toHaveBeenCalledTimes(1);
    expect(mockNext).toHaveBeenCalledTimes(1);
  });

  it("should register finish and close event handlers on the response", () => {
    const middleware = createActiveRequestsCounterMiddleware({
      activeRequestsCounter: mockCounter,
    });
    middleware(mockRequest as Request, mockResponse as Response, mockNext);

    expect(mockResponse.on).toHaveBeenCalledTimes(2);
    expect(mockResponse.on).toHaveBeenCalledWith(
      "finish",
      expect.any(Function),
    );
    expect(mockResponse.on).toHaveBeenCalledWith("close", expect.any(Function));
  });

  it("should call decrease when finish event is emitted", () => {
    const mockOn = vi.fn((event, callback) => {
      if (event === "finish") callback();
    });
    mockResponse.on = mockOn as unknown as Response["on"];

    const middleware = createActiveRequestsCounterMiddleware({
      activeRequestsCounter: mockCounter,
    });
    middleware(mockRequest as Request, mockResponse as Response, mockNext);

    expect(mockCounter.decrease).toHaveBeenCalledTimes(1);
  });

  it("should call decrease when close event is emitted", () => {
    const mockOn = vi.fn((event, callback) => {
      if (event === "close") callback();
    });
    mockResponse.on = mockOn as unknown as Response["on"];

    const middleware = createActiveRequestsCounterMiddleware({
      activeRequestsCounter: mockCounter,
    });
    middleware(mockRequest as Request, mockResponse as Response, mockNext);

    expect(mockCounter.decrease).toHaveBeenCalledTimes(1);
  });

  it("should call next function exactly once", () => {
    const middleware = createActiveRequestsCounterMiddleware({
      activeRequestsCounter: mockCounter,
    });
    middleware(mockRequest as Request, mockResponse as Response, mockNext);

    expect(mockNext).toHaveBeenCalledTimes(1);
  });

  it("should handle both finish and close events calling decrease twice if both occur", () => {
    const callbacks: Record<string, () => void> = {};
    const mockOn = vi.fn((event, callback) => {
      callbacks[event] = callback;
    });
    mockResponse.on = mockOn as unknown as Response["on"];

    const middleware = createActiveRequestsCounterMiddleware({
      activeRequestsCounter: mockCounter,
    });
    middleware(mockRequest as Request, mockResponse as Response, mockNext);

    callbacks.finish?.();
    callbacks.close?.();

    expect(mockCounter.decrease).toHaveBeenCalledTimes(2);
  });
});
