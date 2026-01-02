import type { Request, Response } from "express";
import { auth } from "express-oauth2-jwt-bearer";
import { describe, it, expect, vi, beforeEach } from "vitest";

import { createAuthenticationMiddleware } from "./createAuthenticationMiddleware.js";

vi.mock("express-oauth2-jwt-bearer", () => ({
  auth: vi.fn(),
}));

describe("createAuthenticationMiddleware", () => {
  const validConfig = {
    issuer: "https://keycloak.example.com/realms/internal",
    jwksUri:
      "https://keycloak.example.com/realms/internal/protocol/openid-connect/certs",
    audience: "notification-service",
    tokenSigningAlg: "RS256" as const,
  };

  const mockMiddleware = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (auth as unknown as ReturnType<typeof vi.fn>).mockReturnValue(
      mockMiddleware,
    );
  });

  it("should call auth with correct config", () => {
    createAuthenticationMiddleware(validConfig);

    expect(auth).toHaveBeenCalledWith({
      issuerBaseURL: validConfig.issuer,
      jwksUri: validConfig.jwksUri,
      audience: validConfig.audience,
      tokenSigningAlg: validConfig.tokenSigningAlg,
    });
  });

  it("should use custom tokenSigningAlg when provided", () => {
    const customAlg = "ES256" as const;
    const config = { ...validConfig, tokenSigningAlg: customAlg };
    createAuthenticationMiddleware(config);

    expect(auth).toHaveBeenCalledWith(
      expect.objectContaining({
        tokenSigningAlg: customAlg,
      }),
    );
  });

  it("should return a middleware function", () => {
    const middleware = createAuthenticationMiddleware(validConfig);
    expect(typeof middleware).toBe("function");
  });

  it("should handle auth error and respond with 401", () => {
    const mockError = new Error("Invalid token");
    const mockNext = vi.fn();
    const mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    } as unknown as Response;
    const mockReq = {} as Request;

    (auth as unknown as ReturnType<typeof vi.fn>).mockImplementation(
      () => (req: Request, res: Response, done: (err?: unknown) => void) => {
        done(mockError);
      },
    );

    const middleware = createAuthenticationMiddleware(validConfig);
    middleware(mockReq, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith({
      error: "HTTP 401 Unauthorized",
      message: "Запрос не был авторизован",
    });
    expect(mockNext).not.toHaveBeenCalled();
  });

  it("should call next() on successful auth", () => {
    const mockNext = vi.fn();
    const mockRes = {} as Response;
    const mockReq = {} as Request;

    (auth as unknown as ReturnType<typeof vi.fn>).mockImplementation(
      () => (req: Request, res: Response, done: (err?: unknown) => void) => {
        done(undefined);
      },
    );

    const middleware = createAuthenticationMiddleware(validConfig);
    middleware(mockReq, mockRes, mockNext);

    expect(mockNext).toHaveBeenCalled();
  });
});
