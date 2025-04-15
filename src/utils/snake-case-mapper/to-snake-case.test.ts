import { toSnakeCase, mapKeysToSnakeCase } from "./to-snake-case";

describe("toSnakeCase", () => {
  test("converts camelCase to snake_case", () => {
    expect(toSnakeCase("camelCase")).toBe("camel_case");
    expect(toSnakeCase("anotherTestString")).toBe("another_test_string");
  });

  test("converts PascalCase to snake_case", () => {
    expect(toSnakeCase("PascalCase")).toBe("pascal_case");
    expect(toSnakeCase("AnotherExample")).toBe("another_example");
  });

  test("converts kebab-case to snake_case", () => {
    expect(toSnakeCase("kebab-case")).toBe("kebab_case");
    expect(toSnakeCase("another-example-string")).toBe(
      "another_example_string",
    );
  });

  test("converts space separated to snake_case", () => {
    expect(toSnakeCase("space case")).toBe("space_case");
    expect(toSnakeCase("Another Test String")).toBe("another_test_string");
  });

  test("converts dot.case to snake_case", () => {
    expect(toSnakeCase("dot.case")).toBe("dot_case");
    expect(toSnakeCase("some.file.name")).toBe("some_file_name");
  });

  test("handles UPPER_CASE input", () => {
    expect(toSnakeCase("UPPER_CASE")).toBe("upper_case");
    expect(toSnakeCase("SOME_CONSTANT")).toBe("some_constant");
  });

  test("handles mixed cases", () => {
    expect(toSnakeCase("Mixed CASE")).toBe("mixed_case");
    expect(toSnakeCase("someHTML")).toBe("some_html");
    expect(toSnakeCase("JSONData")).toBe("json_data");
  });

  test("handles special characters", () => {
    expect(toSnakeCase("__dunder__")).toBe("dunder");
    expect(toSnakeCase("  trim  me  ")).toBe("trim_me");
    expect(toSnakeCase("multiple---dashes")).toBe("multiple_dashes");
  });

  test("handles empty string", () => {
    expect(toSnakeCase("")).toBe("");
  });
});

describe("mapKeysToSnakeCase", () => {
  test("converts object keys to snake_case", () => {
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

  test("handles empty object", () => {
    expect(mapKeysToSnakeCase({})).toEqual({});
  });

  test("handles arrays", () => {
    const input = [{ firstItem: 1 }, { secondItem: 2 }];

    const expected = [{ first_item: 1 }, { second_item: 2 }];

    expect(mapKeysToSnakeCase(input)).toEqual(expected);
  });

  test("preserves non-object values", () => {
    expect(mapKeysToSnakeCase(null)).toBeNull();
    expect(mapKeysToSnakeCase(undefined)).toBeUndefined();
    expect(mapKeysToSnakeCase(42)).toBe(42);
    expect(mapKeysToSnakeCase("string")).toBe("string");
  });

  test("handles Date objects", () => {
    const date = new Date("2025-04-14T11:27:45.007Z");
    const result = mapKeysToSnakeCase(date);
    expect(result).toBe(date);
    expect(result.toISOString()).toBe("2025-04-14T11:27:45.007Z");
  });

  test("handles RegExp objects", () => {
    const regex = /test/i;
    expect(mapKeysToSnakeCase(regex)).toBe(regex);
  });

  test("handles Map objects", () => {
    const map = new Map([["key", "value"]]);
    expect(mapKeysToSnakeCase(map)).toBe(map);
  });

  test("handles Set objects", () => {
    const set = new Set([1, 2, 3]);
    expect(mapKeysToSnakeCase(set)).toBe(set);
  });
});
