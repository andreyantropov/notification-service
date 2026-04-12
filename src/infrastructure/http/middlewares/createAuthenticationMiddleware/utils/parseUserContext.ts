import { z } from "zod";

import { type UserContext } from "../../../interfaces/index.js";
import { UNKNOWN_NAME } from "../constants/index.js";

const RoleSchema = z
  .string()
  .trim()
  .min(3, "Роль должна быть не короче 3 символов")
  .max(128, "Роль не должна превышать 128 символов");

const UserContextSchema = z
  .object({
    sub: z
      .string()
      .trim()
      .min(1, "sub не должен быть пустым")
      .max(256, "sub не должен превышать 256 символов"),
    preferred_username: z
      .string()
      .trim()
      .min(2, "preferred_username должен содержать минимум 2 символа")
      .max(256, "preferred_username не должен превышать 256 символов")
      .optional(),
    name: z
      .string()
      .trim()
      .min(2, "name должен содержать минимум 2 символа")
      .max(512, "name не должен превышать 512 символов")
      .optional(),
    roles: z.array(RoleSchema).default([]),
  })
  .transform(({ sub, preferred_username, name, roles }) => ({
    id: sub,
    name: preferred_username || name || UNKNOWN_NAME,
    roles: roles,
  }));

export const parseUserContext = (payload: unknown): UserContext => {
  return UserContextSchema.parse(payload);
};
