import type { SafeParseReturnType } from "zod";
import { ZodSchema } from "zod";

import type { ValidationResult, ValidationError } from "./interfaces/index.js";

export const validateBatch = <T>(
  items: unknown[],
  schema: ZodSchema<T>,
): ValidationResult<T> => {
  const valid: T[] = [];
  const invalid: ValidationError[] = [];

  for (const item of items) {
    const result: SafeParseReturnType<T, T> = schema.safeParse(item);
    if (result.success) {
      valid.push(result.data);
    } else {
      invalid.push({
        item,
        error: result.error.errors,
      });
    }
  }

  return { valid, invalid };
};
