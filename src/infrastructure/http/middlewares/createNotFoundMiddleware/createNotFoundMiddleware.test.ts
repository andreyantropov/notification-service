import { type NextFunction, type Request, type Response } from "express";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { createNotFoundMiddleware } from "./createNotFoundMiddleware.js";

describe("NotFoundMiddleware", () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;

  beforeEach(() => {
    vi.clearAllMocks();

    req = {};
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };
    next = vi.fn();
  });

  it("should return status 404 and not found message", () => {
    const middleware = createNotFoundMiddleware();

    middleware(req as Request, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      message: "Запрошенный ресурс не найден",
    });
  });

  it("should not call next()", () => {
    const middleware = createNotFoundMiddleware();

    middleware(req as Request, res as Response, next);

    expect(next).not.toHaveBeenCalled();
  });
});
