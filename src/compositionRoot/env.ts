import z from "zod";

import pkg from "../../package.json" with { type: "json" };
import {
  ENVIRONMENT_TYPE,
  LOG_LEVEL,
} from "../infrastructure/telemetry/index.js";

const RoleSchema = z
  .string()
  .trim()
  .min(3, "Роль должна быть не короче 3 символов")
  .max(128, "Роль не должна превышать 128 символов");

const EnvSchema = z.object({
  NODE_ENV: z.nativeEnum(ENVIRONMENT_TYPE),
  LOG_LEVEL: z.nativeEnum(LOG_LEVEL).default(LOG_LEVEL.INFO),

  SERVICE_NAME: z
    .string()
    .trim()
    .min(3, "name должен быть не короче 3 символов")
    .max(256, "name не должен превышать 256 символов")
    .default(pkg.name),
  SERVICE_PORT: z.coerce.number().int().positive().default(3000),
  SERVICE_URL: z
    .string()
    .trim()
    .url("url должен быть валидным URL (например, http://localhost:3000/api)"),
  SERVICE_TITLE: z
    .string()
    .trim()
    .min(3, "title должен быть не короче 3 символов")
    .max(256, "title не должен превышать 256 символов")
    .default(pkg.name),

  BITRIX_CHANNEL_BASE_URL: z
    .string()
    .trim()
    .url("baseUrl должен быть валидным URL (например, https://bitrix24.ru)"),
  BITRIX_CHANNEL_USER_ID: z
    .string()
    .trim()
    .min(1, "userId не может быть пустым")
    .max(16, "userId не должен превышать 16 символов")
    .regex(/^\d+$/, "userId должен быть положительным целым числом"),
  BITRIX_CHANNEL_AUTH_TOKEN: z
    .string()
    .trim()
    .min(16, "authToken должен быть не короче 16 символов")
    .max(512, "authToken не должен превышать 512 символов"),
  BITRIX_TIMEOUT_MS: z.coerce.number().int().positive().default(10_000),
  BITRIX_CHANNEL_CONCURRENCY: z.coerce.number().int().positive().default(1),
  BITRIX_CHANNEL_DELAY_MS: z.coerce.number().int().positive().default(500),

  EMAIL_CHANNEL_HOST: z
    .string()
    .trim()
    .min(3, "host должен быть не короче 3 символов")
    .max(256, "host не должен превышать 256 символов"),
  EMAIL_CHANNEL_PORT: z.coerce.number().int().positive().default(25),
  EMAIL_CHANNEL_SECURE: z
    .string()
    .trim()
    .toLowerCase()
    .transform((payload) => payload === "true")
    .default("false"),
  EMAIL_CHANNEL_LOGIN: z
    .string()
    .trim()
    .min(3, "user должен быть не короче 3 символов")
    .max(64, "user не должен превышать 64 символов"),
  EMAIL_CHANNEL_PASSWORD: z
    .string()
    .trim()
    .min(8, "pass должен быть не короче 8 символов")
    .max(256, "pass не должен превышать 256 символов"),
  EMAIL_CHANNEL_FROM_EMAIL: z
    .string()
    .trim()
    .min(8, "fromEmail должен быть не короче 8 символов")
    .max(256, "fromEmail не должен превышать 256 символов"),
  EMAIL_CHANNEL_SUBJECT: z
    .string()
    .trim()
    .min(3, "subject должен быть не короче 3 символов")
    .max(256, "subject не должен превышать 256 символов"),
  EMAIL_CHANNEL_GREETING_TIMEOUT_MS: z.coerce
    .number()
    .int()
    .positive()
    .default(5_000),
  EMAIL_CHANNEL_SOCKET_TIMEOUT_MS: z.coerce
    .number()
    .int()
    .positive()
    .default(10_000),
  EMAIL_CHANNEL_CONCURRENCY: z.coerce.number().int().positive().default(1),
  EMAIL_CHANNEL_DELAY_MS: z.coerce.number().int().positive().default(500),

  AUTHENTICATION_MIDDLEWARE_ISSUER: z
    .string()
    .trim()
    .url(
      "issuer должен быть валидным URL (например, https://keycloak.example.com/realms/internal)",
    ),
  AUTHENTICATION_MIDDLEWARE_JWKS_URI: z
    .string()
    .trim()
    .url(
      "jwksUri должен быть валидным URL (например, https://keycloak.example.com/realms/internal/protocol/openid-connect/certs)",
    ),
  AUTHENTICATION_MIDDLEWARE_AUDIENCE: z
    .string()
    .trim()
    .min(3, "audience должен быть не короче 3 символов")
    .max(128, "audience не должен превышать 128 символов"),
  AUTHENTICATION_MIDDLEWARE_TOKEN_SIGNING_ALG: z
    .enum(["RS256", "RS384", "RS512", "ES256"])
    .default("RS256"),

  AUTHORIZATION_MIDDLEWARE_SERVICE_CLIENT_ID: z
    .string()
    .trim()
    .min(3, "serviceClientId должен быть не короче 3 символов")
    .max(128, "serviceClientId не должен превышать 128 символов"),
  AUTHORIZATION_MIDDLEWARE_REQUIRED_ROLES: z
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
        .array(RoleSchema)
        .min(1, "Список ролей не должен быть пустым")
        .max(50, "Список ролей не должен превышать 50 штук"),
    ),

  TELEMETRY_TRACES_EXPORTER_URL: z
    .string()
    .trim()
    .url(
      "tracesExporterUrl должен быть валидным URL (например, http://otel-collector:4318/v1/traces)",
    )
    .optional(),
  TELEMETRY_LOGS_EXPORTER_URL: z
    .string()
    .trim()
    .url(
      "logsExporterUrl должен быть валидным URL (например, http://otel-collector:4318/v1/logs)",
    )
    .optional(),
  TELEMETRY_METRICS_EXPORTER_URL: z
    .string()
    .trim()
    .url(
      "metricsExporterUrl должен быть валидным URL (например, http://otel-collector:4318/v1/metrics)",
    )
    .optional(),
});

export const env = EnvSchema.parse(process.env);

export type Env = z.infer<typeof EnvSchema>;
