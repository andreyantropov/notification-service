import type { Request, Response } from "express";
import { TimeoutError } from "p-timeout";
import { describe, it, expect, vi } from "vitest";

import { createTimeoutErrorMiddleware } from "./createTimeoutErrorMiddleware.js";

const createMockResponse = (): Response => {
  const res: Partial<Response> = {};
  res.status = vi.fn().mockReturnThis();
  res.json = vi.fn().mockReturnThis();
  return res as Response;
};

const createMockRequest = (): Request => {
  return {} as Request;
};

describe("createTimeoutErrorMiddleware", () => {
  it("should return 504 with error message when error is TimeoutError", () => {
    const middleware = createTimeoutErrorMiddleware();
    const req = createMockRequest();
    const res = createMockResponse();
    const next = vi.fn();

    const timeoutError = new TimeoutError("Custom timeout message");

    middleware(timeoutError, req, res, next);

    expect(res.status).toHaveBeenCalledWith(504);
    expect(res.json).toHaveBeenCalledWith({
      error: "HTTP 504 Gateway Timeout",
      message: "Custom timeout message",
    });
    expect(next).not.toHaveBeenCalled();
  });

  it("should use fallback message when TimeoutError has no message", () => {
    const middleware = createTimeoutErrorMiddleware();
    const req = createMockRequest();
    const res = createMockResponse();
    const next = vi.fn();

    const timeoutError = new TimeoutError("");
    Object.defineProperty(timeoutError, "message", {
      value: "",
      writable: true,
    });

    middleware(timeoutError, req, res, next);

    expect(res.status).toHaveBeenCalledWith(504);
    expect(res.json).toHaveBeenCalledWith({
      error: "HTTP 504 Gateway Timeout",
      message: "Превышено время выполнения запроса",
    });
    expect(next).not.toHaveBeenCalled();
  });

  it("should call next(error) when error is not a TimeoutError", () => {
    const middleware = createTimeoutErrorMiddleware();
    const req = createMockRequest();
    const res = createMockResponse();
    const next = vi.fn();

    const otherError = new Error("Some other error");

    middleware(otherError, req, res, next);

    expect(next).toHaveBeenCalledWith(otherError);
    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
  });

  it("should call next(error) when error is null/undefined (edge safety)", () => {
    const middleware = createTimeoutErrorMiddleware();
    const req = createMockRequest();
    const res = createMockResponse();
    const next = vi.fn();

    middleware(null, req, res, next);

    expect(next).toHaveBeenCalledWith(null);
  });
});
