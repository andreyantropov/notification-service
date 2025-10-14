import { z } from "zod";

import { AuthenticationMiddlewareConfig } from "../infrastructure/http/express/middleware/index.js";
import { AuthorizationMiddlewareConfig } from "../infrastructure/http/express/middleware/index.js";

const authConfigSchema = z.object({
  issuer: z
    .string()
    .url(
      "issuer должен быть валидным URL (например, https://keycloak.example.com/realms/internal)",
    ),
  jwksUri: z
    .string()
    .url(
      "jwksUri должен быть валидным URL (например, https://keycloak.example.com/realms/internal/protocol/openid-connect/certs)",
    ),
  audience: z.string().min(1, "audience не может быть пустым"),
  tokenSigningAlg: z.string().optional().default("RS256"),
  serviceClientId: z.string().min(1, "serviceClientId не может быть пустым"),
  requiredRoles: z
    .array(z.string().min(1, "роль не может быть пустой"))
    .min(1, "должна быть указана хотя бы одна роль"),
});

export const authConfig: AuthenticationMiddlewareConfig &
  AuthorizationMiddlewareConfig = authConfigSchema.parse({
  issuer: process.env.AUTH_ISSUER,
  jwksUri: process.env.AUTH_JWKS_URI,
  audience: process.env.AUTH_AUDIENCE,
  tokenSigningAlg: process.env.AUTH_TOKEN_SIGNING_ALG,
  serviceClientId: process.env.AUTH_SERVICE_CLIENT_ID,
  requiredRoles: process.env.AUTH_REQUIRED_ROLES
    ? process.env.AUTH_REQUIRED_ROLES.split(",")
        .map((r) => r.trim())
        .filter(Boolean)
    : [],
});
