import { Request, Response } from "express";
import { describe, it, expect, vi, beforeEach } from "vitest";

import { createNotFoundMiddleware } from "./createNotFoundMiddleware.js";

describe("NotFoundMiddleware", () => {
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

  it("should return status 404 and not found message", () => {
    const middleware = createNotFoundMiddleware();

    middleware(req as Request, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      error: "HTTP 404 Not Found",
      message: "Запрошенный ресурс не найден",
    });
  });

  it("should not call next()", () => {
    const middleware = createNotFoundMiddleware();

    middleware(req as Request, res as Response, next);

    expect(next).not.toHaveBeenCalled();
  });
});
