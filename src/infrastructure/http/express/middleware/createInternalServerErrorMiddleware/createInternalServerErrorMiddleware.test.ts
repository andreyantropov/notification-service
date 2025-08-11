import { describe, it, expect, vi, beforeEach } from "vitest";
import { Request, Response } from "express";
import { createInternalServerErrorMiddleware } from "./createInternalServerErrorMiddleware.js";

describe("InternalServerErrorMiddleware", () => {
  const middleware = createInternalServerErrorMiddleware();

  const req = {} as Request;
  const res = {} as Response;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return 500 status and error message from provided error", async () => {
    const error = new Error("Database connection failed");
    res.status = vi.fn().mockReturnThis();
    res.json = vi.fn();

    middleware(error, req, res, () => {});

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      error: "HTTP 500 Internal Server Error",
      message: "Database connection failed",
    });
  });

  it("should return 'Unknown error' if error.message is empty", async () => {
    const error = {} as Error;
    res.status = vi.fn().mockReturnThis();
    res.json = vi.fn();

    middleware(error, req, res, () => {});

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      error: "HTTP 500 Internal Server Error",
      message: "Unknown error",
    });
  });
});
