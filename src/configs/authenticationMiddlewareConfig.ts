import z from "zod";

import { AuthenticationMiddlewareConfig } from "../infrastructure/http/index.js";

const authenticationMiddlewareConfigSchema = z.object({
  issuer: z
    .string()
    .trim()
    .url(
      "issuer должен быть валидным URL (например, https://keycloak.example.com/realms/internal)",
    ),
  jwksUri: z
    .string()
    .trim()
    .url(
      "jwksUri должен быть валидным URL (например, https://keycloak.example.com/realms/internal/protocol/openid-connect/certs)",
    ),
  audience: z
    .string()
    .trim()
    .min(3, "audience должен быть не короче 3 символов")
    .max(128, "audience не должен превышать 128 символов"),
  tokenSigningAlg: z
    .enum(["RS256", "RS384", "RS512", "ES256"])
    .default("RS256"),
});

export const authenticationMiddlewareConfig: AuthenticationMiddlewareConfig =
  authenticationMiddlewareConfigSchema.parse({
    issuer: process.env.AUTHENTICATION_MIDDLEWARE_ISSUER,
    jwksUri: process.env.AUTHENTICATION_MIDDLEWARE_JWKS_URI,
    audience: process.env.AUTHENTICATION_MIDDLEWARE_AUDIENCE,
    tokenSigningAlg: process.env.AUTHENTICATION_MIDDLEWARE_TOKEN_SIGNING_ALG,
  });
