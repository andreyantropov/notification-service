import { type NextFunction, type Request, type Response } from "express";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { type UserContext } from "../../interfaces/index.js";

import { createAuthorizationMiddleware } from "./createAuthorizationMiddleware.js";
import { type AuthorizationMiddlewareConfig } from "./interfaces/index.js";

type RequestWithUser = Request & { user?: UserContext };

describe("createAuthorizationMiddleware", () => {
  const config: AuthorizationMiddlewareConfig = {
    requiredRoles: ["ADMIN", "MANAGER"],
    serviceClientId: "test-client-id",
  };

  let mockResponse: Partial<Response>;
  let nextFunction: NextFunction;

  beforeEach(() => {
    vi.clearAllMocks();
    mockResponse = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };
    nextFunction = vi.fn();
  });

  it("should call next with error if req.user is missing", () => {
    const middleware = createAuthorizationMiddleware(config);
    const mockRequest = {} as unknown as RequestWithUser;

    middleware(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(nextFunction).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Запрос не был авторизован" }),
    );
  });

  it("should return 403 if user does not have any of the required roles", () => {
    const middleware = createAuthorizationMiddleware(config);
    const mockRequest = {
      user: { id: "1", name: "User", roles: ["USER"] },
    } as unknown as RequestWithUser;

    middleware(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(mockResponse.status).toHaveBeenCalledWith(403);
    expect(mockResponse.json).toHaveBeenCalledWith({
      message: "Недостаточно прав для выполнения операции",
    });
    expect(nextFunction).not.toHaveBeenCalled();
  });

  it("should call next() if user has at least one of the required roles", () => {
    const middleware = createAuthorizationMiddleware(config);
    const mockRequest = {
      user: { id: "1", name: "Admin", roles: ["ADMIN"] },
    } as unknown as RequestWithUser;

    middleware(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(nextFunction).toHaveBeenCalledWith();
    expect(mockResponse.status).not.toHaveBeenCalled();
  });

  it("should work correctly with multiple roles in user context", () => {
    const middleware = createAuthorizationMiddleware(config);
    const mockRequest = {
      user: { id: "1", name: "Mixed", roles: ["GUEST", "MANAGER"] },
    } as unknown as RequestWithUser;

    middleware(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(nextFunction).toHaveBeenCalled();
  });
});
