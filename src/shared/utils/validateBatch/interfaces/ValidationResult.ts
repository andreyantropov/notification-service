import type { ValidationError } from "./ValidationError.js";

export interface ValidationResult<T> {
  readonly valid: readonly T[];
  readonly invalid: readonly ValidationError[];
}
