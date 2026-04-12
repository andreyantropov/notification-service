import { type NextFunction, type Request, type Response } from "express";
import { describe, expect, it, vi } from "vitest";

import { createMockAuthorizationMiddleware } from "./createMockAuthorizationMiddleware";

describe("createMockAuthorizationMiddleware", () => {
  it("should call next() without any arguments to proceed", () => {
    const middleware = createMockAuthorizationMiddleware();

    const req = {} as Request;
    const res = {} as Response;
    const next = vi.fn() as NextFunction;

    middleware(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);

    expect(next).toHaveBeenCalledWith();
  });

  it("should not modify the response or send any data", () => {
    const middleware = createMockAuthorizationMiddleware();

    const req = {} as Request;
    const res = {
      send: vi.fn(),
      json: vi.fn(),
      status: vi.fn().mockReturnThis(),
    } as unknown as Response;
    const next = vi.fn() as NextFunction;

    middleware(req, res, next);

    expect(res.send).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
  });

  it("should return void when executed", () => {
    const middleware = createMockAuthorizationMiddleware();

    const req = {} as Request;
    const res = {} as Response;
    const next = vi.fn() as NextFunction;

    const result = middleware(req, res, next);

    expect(result).toBeUndefined();
  });
});
