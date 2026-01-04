import { z } from "zod";

import type { AuthorizationMiddlewareConfig } from "@notification-platform/http";

const schema = z.object({
  serviceClientId: z
    .string()
    .trim()
    .min(3, "serviceClientId должен быть не короче 3 символов")
    .max(128, "serviceClientId не должен превышать 128 символов"),
  requiredRoles: z
    .string()
    .trim()
    .min(1, "requiredRoles не должен быть пустым")
    .max(1024, "requiredRoles не должен превышать 1024 символов")
    .transform((roles) => {
      return roles
        .split(",")
        .map((role) => role.trim())
        .filter(Boolean);
    })
    .pipe(
      z
        .array(
          z
            .string()
            .trim()
            .min(3, "Каждая роль должна быть не короче 3 символов")
            .max(128, "Каждая роль не должна превышать 128 символов"),
        )
        .min(1, "Должна быть указана хотя бы одна роль"),
    ),
});

const rawEnv = {
  serviceClientId: process.env.AUTHORIZATION_MIDDLEWARE_SERVICE_CLIENT_ID,
  requiredRoles: process.env.AUTHORIZATION_MIDDLEWARE_REQUIRED_ROLES,
};

const isEnabled = process.env.AUTHORIZATION_MIDDLEWARE_IS_ENABLED !== "false";

export const authorizationMiddlewareConfig: AuthorizationMiddlewareConfig | null =
  isEnabled ? schema.parse(rawEnv) : null;
