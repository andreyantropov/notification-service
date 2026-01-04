import z from "zod";

export interface ValidationError {
  readonly item: unknown;
  readonly error: readonly z.ZodIssue[];
}
