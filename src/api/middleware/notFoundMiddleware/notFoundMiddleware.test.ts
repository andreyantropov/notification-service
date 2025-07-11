import { describe, it, expect, vi, beforeEach } from "vitest";
import { Request, Response } from "express";
import { createNotFoundMiddleware } from "./notFoundMiddleware.js";

describe("NotFoundMiddleware", () => {
  const middleware = createNotFoundMiddleware();

  const req = {} as Request;
  const res = {} as Response;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return status 404 and not found message", async () => {
    res.status = vi.fn().mockReturnThis();
    res.json = vi.fn();

    middleware(req, res, () => {});

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      error: "HTTP 404 Not Found",
      message: "Запрошенный ресурс не найден",
    });
  });

  it("should not call next() or throw errors", async () => {
    const next = vi.fn();

    middleware(req, res, () => {});

    expect(next).not.toHaveBeenCalled();
  });
});
