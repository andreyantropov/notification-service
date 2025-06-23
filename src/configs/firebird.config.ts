import { z } from "zod";
import { FirebirdSourceConfig } from "../infrastructure/sources/firebirdSource/interfaces/FirebirdSourceConfig.js";

const supportedEncodings = ["UTF8", "WIN1251", "WIN1252"] as const;

const firebirdConfigSchema = z.object({
  host: z.string().min(1, "FIREBIRD_DB_HOST обязателен").default("localhost"),
  port: z.coerce.number().int().positive().default(3050),
  database: z.string().min(1, "FIREBIRD_DB_NAME обязателен"),
  user: z.string().min(1, "FIREBIRD_DB_USER обязателен"),
  password: z.string().min(1, "FIREBIRD_DB_PASSWORD обязателен"),
  role: z.string().optional(),
  lowercase_keys: z.boolean().default(true),
  pageSize: z.number().default(4096),
  retryConnectionInterval: z.number().default(1000),
  blobAsText: z.boolean().default(false),
  encoding: z.enum(supportedEncodings).default("UTF8"),
});

export const firebirdConfig: FirebirdSourceConfig = firebirdConfigSchema.parse({
  host: process.env.FIREBIRD_DB_HOST,
  port: process.env.FIREBIRD_DB_PORT,
  database: process.env.FIREBIRD_DB_NAME,
  user: process.env.FIREBIRD_DB_USER,
  password: process.env.FIREBIRD_DB_PASSWORD,
  role: process.env.FIREBIRD_DB_ROLE,
  lowercase_keys: true,
  pageSize: 4096,
  retryConnectionInterval: 1000,
  blobAsText: false,
  encoding: "UTF8",
});
