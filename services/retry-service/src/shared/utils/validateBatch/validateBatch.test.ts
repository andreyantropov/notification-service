import { describe, it, expect } from "vitest";
import { z } from "zod";

import type {
  BatchValidationResult,
  ValidationError,
} from "./interfaces/index.js";
import { validateBatch } from "./validateBatch.js";

const testSchema = z.object({
  name: z.string().min(2),
  age: z.number().int().positive(),
});

type TestItem = z.infer<typeof testSchema>;

describe("validateBatch", () => {
  it("should return all items as valid when all pass validation", () => {
    const items: unknown[] = [
      { name: "Alice", age: 30 },
      { name: "Bob", age: 25 },
    ];

    const result: BatchValidationResult<TestItem> = validateBatch(
      items,
      testSchema,
    );

    const expectedValid: TestItem[] = [
      { name: "Alice", age: 30 },
      { name: "Bob", age: 25 },
    ];

    expect(result.valid).toEqual(expectedValid);
    expect(result.invalid).toEqual([]);
  });

  it("should return all items as invalid when none pass validation", () => {
    const items: unknown[] = [
      { name: "A", age: 30 },
      { name: "Bob", age: -5 },
      "not an object",
    ];

    const result: BatchValidationResult<TestItem> = validateBatch(
      items,
      testSchema,
    );

    expect(result.valid).toEqual([]);
    expect(result.invalid).toHaveLength(3);

    const firstInvalid: ValidationError = result.invalid[0]!;
    expect(firstInvalid.item).toEqual({ name: "A", age: 30 });
    expect(firstInvalid.error).toBeInstanceOf(Array);
    expect(firstInvalid.error[0]).toHaveProperty("code", "too_small");
    expect(firstInvalid.error[0]).toHaveProperty("path", ["name"]);

    const secondInvalid: ValidationError = result.invalid[1]!;
    expect(secondInvalid.item).toEqual({ name: "Bob", age: -5 });
    expect(secondInvalid.error).toBeInstanceOf(Array);
    expect(secondInvalid.error[0]).toHaveProperty("code", "too_small");

    const thirdInvalid: ValidationError = result.invalid[2]!;
    expect(thirdInvalid.item).toEqual("not an object");
    expect(thirdInvalid.error).toBeInstanceOf(Array);
    expect(thirdInvalid.error[0]).toHaveProperty("code", "invalid_type");
  });

  it("should return mixed valid and invalid items when some pass and some fail validation", () => {
    const items: unknown[] = [
      { name: "Alice", age: 30 },
      { name: "A", age: 30 },
      { name: "Charlie", age: 40 },
      { name: "Bob", age: -5 },
    ];

    const result: BatchValidationResult<TestItem> = validateBatch(
      items,
      testSchema,
    );

    const expectedValid: TestItem[] = [
      { name: "Alice", age: 30 },
      { name: "Charlie", age: 40 },
    ];
    expect(result.valid).toEqual(expectedValid);
    expect(result.invalid).toHaveLength(2);

    const invalidItems = result.invalid.map((v) => v.item);
    expect(invalidItems).toContainEqual({ name: "A", age: 30 });
    expect(invalidItems).toContainEqual({ name: "Bob", age: -5 });
  });

  it("should return empty valid and invalid arrays when input array is empty", () => {
    const items: unknown[] = [];

    const result: BatchValidationResult<TestItem> = validateBatch(
      items,
      testSchema,
    );

    expect(result.valid).toEqual([]);
    expect(result.invalid).toEqual([]);
  });

  it("should handle items with extra properties correctly if schema allows it", () => {
    const looseSchema = testSchema.passthrough();

    const items: unknown[] = [
      { name: "Alice", age: 30, extra: "ignored" },
      { name: "Bob", age: 25 },
      { name: "C", age: 35, another: "field" },
    ];

    const result: BatchValidationResult<z.infer<typeof looseSchema>> =
      validateBatch(items, looseSchema);

    const expectedValid = [
      { name: "Alice", age: 30, extra: "ignored" },
      { name: "Bob", age: 25 },
    ];
    expect(result.valid).toEqual(expectedValid);
    expect(result.invalid).toHaveLength(1);
    expect(result.invalid[0]!.item).toEqual({
      name: "C",
      age: 35,
      another: "field",
    });
  });

  it("should handle items where Zod performs coercion", () => {
    const coercedSchema = z.object({
      name: z.string().min(2),
      age: z.coerce.number().int().positive(),
    });

    const items: unknown[] = [
      { name: "Alice", age: "30" },
      { name: "Bob", age: 25 },
      { name: "Charlie", age: "abc" },
    ];

    const result: BatchValidationResult<z.infer<typeof coercedSchema>> =
      validateBatch(items, coercedSchema);

    const expectedValid = [
      { name: "Alice", age: 30 },
      { name: "Bob", age: 25 },
    ];
    expect(result.valid).toEqual(expectedValid);
    expect(result.invalid).toHaveLength(1);
    expect(result.invalid[0]!.item).toEqual({ name: "Charlie", age: "abc" });
  });
});
