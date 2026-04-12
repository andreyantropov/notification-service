import { type NextFunction, type Request, type Response } from "express";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { createInternalServerErrorMiddleware } from "./createInternalServerErrorMiddleware.js";

describe("createInternalServerErrorMiddleware", () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let nextFunction: NextFunction;

  beforeEach(() => {
    mockRequest = {};
    mockResponse = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };
    nextFunction = vi.fn();
  });

  it("should return 500 status and generic error message", () => {
    const middleware = createInternalServerErrorMiddleware();
    const someError = new Error("Unexpected crash");

    middleware(
      someError,
      mockRequest as Request,
      mockResponse as Response,
      nextFunction,
    );

    expect(mockResponse.status).toHaveBeenCalledWith(500);
    expect(mockResponse.json).toHaveBeenCalledWith({
      message: "Внутренняя ошибка сервера",
    });
  });

  it("should not call next() as it is a final error handler", () => {
    const middleware = createInternalServerErrorMiddleware();
    const someError = new Error("Database down");

    middleware(
      someError,
      mockRequest as Request,
      mockResponse as Response,
      nextFunction,
    );

    expect(nextFunction).not.toHaveBeenCalled();
  });
});
