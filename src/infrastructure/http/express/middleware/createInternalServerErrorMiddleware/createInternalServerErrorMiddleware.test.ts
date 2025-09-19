import { Request, Response } from "express";
import { describe, it, expect, vi, beforeEach } from "vitest";

import { createInternalServerErrorMiddleware } from "./createInternalServerErrorMiddleware.js";

describe("InternalServerErrorMiddleware", () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();

    req = {};
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    next = vi.fn();
  });

  it("should return 500 status and error message from provided error", () => {
    const middleware = createInternalServerErrorMiddleware();
    const error = new Error("Database connection failed");

    middleware(error, req as Request, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      error: "HTTP 500 Internal Server Error",
      message: "Database connection failed",
    });
  });

  it("should return 'Unknown error' if error.message is falsy", () => {
    const middleware = createInternalServerErrorMiddleware();
    const error = { message: "" } as Error;

    middleware(error, req as Request, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      error: "HTTP 500 Internal Server Error",
      message: "Unknown error",
    });
  });

  it("should not call next()", () => {
    const middleware = createInternalServerErrorMiddleware();
    const error = new Error("Test error");

    middleware(error, req as Request, res as Response, next);

    expect(next).not.toHaveBeenCalled();
  });
});
