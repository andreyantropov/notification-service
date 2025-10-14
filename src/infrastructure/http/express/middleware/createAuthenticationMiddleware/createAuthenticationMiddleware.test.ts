import { auth } from "express-oauth2-jwt-bearer";
import { describe, it, expect, vi, beforeEach } from "vitest";

import { createAuthenticationMiddleware } from "./createAuthenticationMiddleware";

vi.mock("express-oauth2-jwt-bearer", () => ({
  auth: vi.fn(),
}));

describe("createAuthenticationMiddleware", () => {
  const validConfig = {
    issuer: "https://keycloak.example.com/realms/internal",
    jwksUri:
      "https://keycloak.example.com/realms/internal/protocol/openid-connect/certs",
    audience: "notification-service",
  };

  const mockMiddleware = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (auth as unknown as ReturnType<typeof vi.fn>).mockReturnValue(
      mockMiddleware,
    );
  });

  it.each([
    { field: "issuer", value: "" },
    { field: "jwksUri", value: "" },
    { field: "audience", value: "" },
  ])("should throw if $field is missing or empty", ({ field, value }) => {
    const config = { ...validConfig, [field]: value };
    expect(() => createAuthenticationMiddleware(config)).toThrow(
      "Не заполнены обязательные поля конфигурации",
    );
  });

  it("should call auth with correct config", () => {
    createAuthenticationMiddleware(validConfig);

    expect(auth).toHaveBeenCalledWith({
      issuerBaseURL: validConfig.issuer,
      jwksUri: validConfig.jwksUri,
      audience: validConfig.audience,
      tokenSigningAlg: "RS256",
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
});
