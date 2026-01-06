import type { Request, Response } from "express";
import { describe, it, expect, vi } from "vitest";

import { createAuthorizationMiddleware } from "./createAuthorizationMiddleware.js";

const mockConfig = {
  serviceClientId: "notification-service",
  requiredRoles: ["send"],
};

type MockAuth = {
  payload: {
    resource_access?: {
      [service: string]: {
        roles?: string[];
      };
    };
  };
};

const createMockRequest = (auth?: MockAuth): Request => {
  return { auth } as unknown as Request;
};

describe("createAuthorizationMiddleware", () => {
  it("should call next() if user has one of the required roles", () => {
    const req = createMockRequest({
      payload: {
        resource_access: {
          "notification-service": { roles: ["send"] },
        },
      },
    });

    const res = {} as Response;
    const next = vi.fn();

    const middleware = createAuthorizationMiddleware(mockConfig);
    middleware(req, res, next);

    expect(next).toHaveBeenCalled();
  });

  it("should call next() if user has one role from multiple required", () => {
    const req = createMockRequest({
      payload: {
        resource_access: {
          "notification-service": { roles: ["admin"] },
        },
      },
    });

    const res = {} as Response;
    const next = vi.fn();

    const middleware = createAuthorizationMiddleware({
      serviceClientId: "notification-service",
      requiredRoles: ["send", "admin", "operator"],
    });
    middleware(req, res, next);

    expect(next).toHaveBeenCalled();
  });

  it("should return 403 if user does not have any of the required roles", () => {
    const req = createMockRequest({
      payload: {
        resource_access: {
          "notification-service": { roles: ["viewer"] },
        },
      },
    });

    const statusMock = vi.fn().mockReturnThis();
    const jsonMock = vi.fn();
    const res = { status: statusMock, json: jsonMock } as unknown as Response;
    const next = vi.fn();

    const middleware = createAuthorizationMiddleware(mockConfig);
    middleware(req, res, next);

    expect(statusMock).toHaveBeenCalledWith(403);
    expect(jsonMock).toHaveBeenCalledWith({
      error: "HTTP 403 Forbidden",
      message: "Недостаточно прав для выполнения операции",
    });
    expect(next).not.toHaveBeenCalled();
  });

  it("should return 403 if resource_access for the service is missing", () => {
    const req = createMockRequest({
      payload: {
        resource_access: {
          "other-service": { roles: ["send"] },
        },
      },
    });

    const statusMock = vi.fn().mockReturnThis();
    const jsonMock = vi.fn();
    const res = { status: statusMock, json: jsonMock } as unknown as Response;
    const next = vi.fn();

    const middleware = createAuthorizationMiddleware(mockConfig);
    middleware(req, res, next);

    expect(statusMock).toHaveBeenCalledWith(403);
    expect(jsonMock).toHaveBeenCalledWith({
      error: "HTTP 403 Forbidden",
      message: "Недостаточно прав для выполнения операции",
    });
    expect(next).not.toHaveBeenCalled();
  });

  it("should return 403 if roles array is empty", () => {
    const req = createMockRequest({
      payload: {
        resource_access: {
          "notification-service": { roles: [] },
        },
      },
    });

    const statusMock = vi.fn().mockReturnThis();
    const jsonMock = vi.fn();
    const res = { status: statusMock, json: jsonMock } as unknown as Response;
    const next = vi.fn();

    const middleware = createAuthorizationMiddleware(mockConfig);
    middleware(req, res, next);

    expect(statusMock).toHaveBeenCalledWith(403);
    expect(jsonMock).toHaveBeenCalledWith({
      error: "HTTP 403 Forbidden",
      message: "Недостаточно прав для выполнения операции",
    });
    expect(next).not.toHaveBeenCalled();
  });

  it("should return 403 if resource_access is undefined", () => {
    const req = createMockRequest({
      payload: {},
    });

    const statusMock = vi.fn().mockReturnThis();
    const jsonMock = vi.fn();
    const res = { status: statusMock, json: jsonMock } as unknown as Response;
    const next = vi.fn();

    const middleware = createAuthorizationMiddleware(mockConfig);
    middleware(req, res, next);

    expect(statusMock).toHaveBeenCalledWith(403);
    expect(jsonMock).toHaveBeenCalledWith({
      error: "HTTP 403 Forbidden",
      message: "Недостаточно прав для выполнения операции",
    });
    expect(next).not.toHaveBeenCalled();
  });

  it("should pass error to next if req.auth is missing", () => {
    const req = createMockRequest();
    const res = {} as Response;
    const next = vi.fn();

    const middleware = createAuthorizationMiddleware(mockConfig);
    middleware(req, res, next);

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "Запрос не был авторизован",
      }),
    );
  });

  it("should pass error to next if req.auth is null", () => {
    const req = { auth: null } as unknown as Request;
    const res = {} as Response;
    const next = vi.fn();

    const middleware = createAuthorizationMiddleware(mockConfig);
    middleware(req, res, next);

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "Запрос не был авторизован",
      }),
    );
  });

  it("should pass error to next if req.auth is undefined", () => {
    const req = { auth: undefined } as unknown as Request;
    const res = {} as Response;
    const next = vi.fn();

    const middleware = createAuthorizationMiddleware(mockConfig);
    middleware(req, res, next);

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "Запрос не был авторизован",
      }),
    );
  });
});
