import { type NextFunction, type Request, type Response } from "express";
import { TimeoutError } from "p-timeout";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { createTimeoutErrorMiddleware } from "./createTimeoutErrorMiddleware.js";

describe("createTimeoutErrorMiddleware", () => {
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

  it("should return 504 status and error message when error is an instance of TimeoutError", () => {
    const middleware = createTimeoutErrorMiddleware();
    const timeoutError = new TimeoutError();

    middleware(
      timeoutError,
      mockRequest as Request,
      mockResponse as Response,
      nextFunction,
    );

    expect(mockResponse.status).toHaveBeenCalledWith(504);
    expect(mockResponse.json).toHaveBeenCalledWith({
      message: "Превышено время выполнения запроса",
    });
    expect(nextFunction).not.toHaveBeenCalled();
  });

  it("should call next(error) when error is not a TimeoutError", () => {
    const middleware = createTimeoutErrorMiddleware();
    const regularError = new Error("Something went wrong");

    middleware(
      regularError,
      mockRequest as Request,
      mockResponse as Response,
      nextFunction,
    );

    expect(nextFunction).toHaveBeenCalledWith(regularError);
    expect(mockResponse.status).not.toHaveBeenCalled();
    expect(mockResponse.json).not.toHaveBeenCalled();
  });

  it("should call next(error) when error is a string or other type", () => {
    const middleware = createTimeoutErrorMiddleware();
    const stringError = "Unexpected error";

    middleware(
      stringError as unknown as Error,
      mockRequest as Request,
      mockResponse as Response,
      nextFunction,
    );

    expect(nextFunction).toHaveBeenCalledWith(stringError);
    expect(mockResponse.status).not.toHaveBeenCalled();
  });
});
