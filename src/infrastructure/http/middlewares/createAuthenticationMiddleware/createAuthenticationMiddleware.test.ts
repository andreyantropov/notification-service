import { type NextFunction, type Request, type Response } from "express";
import { auth } from "express-oauth2-jwt-bearer";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { createAuthenticationMiddleware } from "./createAuthenticationMiddleware.js";
import { type AuthenticationMiddlewareConfig } from "./interfaces/index.js";
import { parseUserContext } from "./utils/parseUserContext.js";

vi.mock("express-oauth2-jwt-bearer", () => ({
  auth: vi.fn(),
}));

vi.mock("./utils/parseUserContext.js", () => ({
  parseUserContext: vi.fn(),
}));

type RequestWithAuth = Request & {
  auth?: { payload: unknown };
  user?: unknown;
};

describe("createAuthenticationMiddleware", () => {
  const mockConfig: AuthenticationMiddlewareConfig = {
    issuer: "https://test.auth.com",
    jwksUri: "https://test.auth.com",
    audience: "test-audience",
    tokenSigningAlg: "RS256",
  };

  let mockRes: Partial<Response>;
  let next: NextFunction;
  let jwtAuthInternalHandler: (
    req: Request,
    res: Response,
    cb: (err?: unknown) => void,
  ) => void;

  beforeEach(() => {
    vi.clearAllMocks();
    mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };
    next = vi.fn();

    jwtAuthInternalHandler = vi.fn((req, res, cb) => cb());
    vi.mocked(auth).mockReturnValue(
      jwtAuthInternalHandler as unknown as ReturnType<typeof auth>,
    );
  });

  it("should return 401 if JWT authentication fails (invalid token/signature)", async () => {
    jwtAuthInternalHandler = vi.fn((req, res, cb) =>
      cb(new Error("Invalid token")),
    );
    vi.mocked(auth).mockReturnValue(
      jwtAuthInternalHandler as unknown as ReturnType<typeof auth>,
    );

    const middleware = createAuthenticationMiddleware(mockConfig);
    middleware({} as Request, mockRes as Response, next);

    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith({
      message: "Запрос не был авторизован",
    });
    expect(next).not.toHaveBeenCalled();
  });

  it("should return 401 if parseUserContext throws (invalid token payload structure)", () => {
    vi.mocked(parseUserContext).mockImplementation(() => {
      throw new Error("Zod validation failed");
    });

    const middleware = createAuthenticationMiddleware(mockConfig);
    const mockReq = { auth: { payload: {} } } as unknown as RequestWithAuth;

    middleware(mockReq as Request, mockRes as Response, next);

    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith({
      message: "Некорректная структура токена авторизации",
    });
    expect(next).not.toHaveBeenCalled();
  });

  it("should successfully set req.user and call next()", () => {
    const mockUser = { id: "123", name: "John", roles: ["ADMIN"] };
    const mockPayload = { sub: "123", name: "John" };

    vi.mocked(parseUserContext).mockReturnValue(mockUser);

    const middleware = createAuthenticationMiddleware(mockConfig);
    const mockReq = {
      auth: { payload: mockPayload },
    } as unknown as RequestWithAuth;

    middleware(mockReq as Request, mockRes as Response, next);

    expect(mockReq.user).toEqual(mockUser);
    expect(next).toHaveBeenCalledWith();
  });
});
