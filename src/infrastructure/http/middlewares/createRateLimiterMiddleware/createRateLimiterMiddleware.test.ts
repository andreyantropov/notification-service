import { type NextFunction, type Request, type Response } from "express";
import rateLimit, { type Options } from "express-rate-limit";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { createRateLimiterMiddleware } from "./createRateLimiterMiddleware.js";
import { type RateLimiterMiddlewareConfig } from "./interfaces/index.js";

vi.mock("express-rate-limit", () => ({
  default: vi.fn().mockImplementation((options) => options),
}));

describe("createRateLimiterMiddleware", () => {
  const config: RateLimiterMiddlewareConfig = {
    windowMs: 15 * 60 * 1000,
    max: 100,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should initialize rateLimit with provided config and default settings", () => {
    createRateLimiterMiddleware(config);

    expect(rateLimit).toHaveBeenCalledWith(
      expect.objectContaining({
        windowMs: config.windowMs,
        max: config.max,
        standardHeaders: true,
        legacyHeaders: false,
        message: "Превышен лимит запросов, попробуйте повторить запрос позже",
      }),
    );
  });

  it("should correctly handle rate limit exceed in the handler", () => {
    createRateLimiterMiddleware(config);

    const passedOptions = vi.mocked(rateLimit).mock.calls[0][0] as Options;

    const mockRequest = {} as Request;
    const mockResponse = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    } as unknown as Response;
    const nextFunction = vi.fn() as NextFunction;

    const testOptions = {
      statusCode: 429,
      message: "Test error message",
    } as Options;

    if (passedOptions.handler) {
      passedOptions.handler(
        mockRequest,
        mockResponse,
        nextFunction,
        testOptions,
      );
    } else {
      throw new Error("Handler was not defined in rateLimit options");
    }

    expect(mockResponse.status).toHaveBeenCalledWith(429);
    expect(mockResponse.json).toHaveBeenCalledWith("Test error message");
  });
});
