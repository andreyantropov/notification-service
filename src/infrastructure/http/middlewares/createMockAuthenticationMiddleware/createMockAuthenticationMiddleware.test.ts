import { type NextFunction, type Request, type Response } from "express";
import { describe, expect, it, vi } from "vitest";

import { type UserContext } from "../../interfaces/index.js";

import { DEFAULT_MOCK_USER_CONTEXT } from "./constants/index.js";
import { createMockAuthenticationMiddleware } from "./createMockAuthenticationMiddleware.js";

type RequestWithUser = Request & { user: UserContext };

describe("createMockAuthenticationMiddleware", () => {
  it("should attach DEFAULT_MOCK_USER_CONTEXT to the request user property", () => {
    const middleware = createMockAuthenticationMiddleware();

    const mockReq = {} as unknown as RequestWithUser;
    const mockRes = {} as unknown as Response;
    const next = vi.fn() as NextFunction;

    middleware(mockReq, mockRes, next);

    expect(mockReq.user).toEqual(DEFAULT_MOCK_USER_CONTEXT);
    expect(mockReq.user.id).toBe("ANONYMOUS");
  });

  it("should call next() function exactly once", () => {
    const middleware = createMockAuthenticationMiddleware();
    const mockReq = {} as unknown as Request;
    const mockRes = {} as unknown as Response;
    const next = vi.fn() as NextFunction;

    middleware(mockReq, mockRes, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith();
  });
});
