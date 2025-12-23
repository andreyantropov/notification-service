import { SubjectSchema } from "./schemas/index.js";
import type { Subject } from "../../../domain/types/index.js";

export const extractSubjectFromToken = (payload: unknown): Subject => {
  const parsed = SubjectSchema.safeParse(payload);
  if (!parsed.success) {
    throw new Error(
      `Не удалось извлечь данные об отправителе запроса: ${parsed.error.message}`,
    );
  }

  const { sub, preferred_username, name } = parsed.data;
  return {
    id: sub,
    name: preferred_username || name,
  };
};
