import { describe, expect, it } from "vitest";

import { mapKeysToSnakeCase } from "./mapKeysToSnakeCase.js";

describe("mapKeysToSnakeCase", () => {
  it("converts object keys to snake_case", () => {
    const input = {
      camelCase: 1,
      PascalCase: 2,
      "kebab-case": 3,
      "space case": 4,
      nestedObject: {
        innerValue: 5,
        anotherInner: 6,
      },
      arrayValue: [{ firstItem: 7 }, { secondItem: 8 }],
    };

    const expected = {
      camel_case: 1,
      pascal_case: 2,
      kebab_case: 3,
      space_case: 4,
      nested_object: {
        inner_value: 5,
        another_inner: 6,
      },
      array_value: [{ first_item: 7 }, { second_item: 8 }],
    };

    expect(mapKeysToSnakeCase(input)).toEqual(expected);
  });

  it("handles empty object", () => {
    expect(mapKeysToSnakeCase({})).toEqual({});
  });

  it("handles arrays", () => {
    const input = [{ firstItem: 1 }, { secondItem: 2 }];
    const expected = [{ first_item: 1 }, { second_item: 2 }];
    expect(mapKeysToSnakeCase(input)).toEqual(expected);
  });

  it("preserves non-object values", () => {
    expect(mapKeysToSnakeCase(null)).toBeNull();
    expect(mapKeysToSnakeCase(undefined)).toBeUndefined();
    expect(mapKeysToSnakeCase(42)).toBe(42);
    expect(mapKeysToSnakeCase("string")).toBe("string");
  });

  it("handles Date objects", () => {
    const date = new Date("2025-04-14T11:27:45.007Z");
    const result = mapKeysToSnakeCase(date);
    expect(result).toBe(date);
    expect(result.toISOString()).toBe("2025-04-14T11:27:45.007Z");
  });

  it("handles RegExp objects", () => {
    const regex = /test/i;
    expect(mapKeysToSnakeCase(regex)).toBe(regex);
  });

  it("handles Map objects", () => {
    const map = new Map([["key", "value"]]);
    expect(mapKeysToSnakeCase(map)).toBe(map);
  });

  it("handles Set objects", () => {
    const set = new Set([1, 2, 3]);
    expect(mapKeysToSnakeCase(set)).toBe(set);
  });
});
