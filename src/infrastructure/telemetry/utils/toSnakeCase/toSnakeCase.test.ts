import { describe, expect, it } from "vitest";

import { toSnakeCase } from "./toSnakeCase.js";

describe("toSnakeCase", () => {
  it("converts camelCase to snake_case", () => {
    expect(toSnakeCase("camelCase")).toBe("camel_case");
    expect(toSnakeCase("anotherTestString")).toBe("another_test_string");
  });

  it("converts PascalCase to snake_case", () => {
    expect(toSnakeCase("PascalCase")).toBe("pascal_case");
    expect(toSnakeCase("AnotherExample")).toBe("another_example");
  });

  it("converts kebab-case to snake_case", () => {
    expect(toSnakeCase("kebab-case")).toBe("kebab_case");
    expect(toSnakeCase("another-example-string")).toBe(
      "another_example_string",
    );
  });

  it("converts space separated to snake_case", () => {
    expect(toSnakeCase("space case")).toBe("space_case");
    expect(toSnakeCase("Another Test String")).toBe("another_test_string");
  });

  it("converts dot.case to snake_case", () => {
    expect(toSnakeCase("dot.case")).toBe("dot_case");
    expect(toSnakeCase("some.file.name")).toBe("some_file_name");
  });

  it("handles UPPER_CASE input", () => {
    expect(toSnakeCase("UPPER_CASE")).toBe("upper_case");
    expect(toSnakeCase("SOME_CONSTANT")).toBe("some_constant");
  });

  it("handles mixed cases", () => {
    expect(toSnakeCase("Mixed CASE")).toBe("mixed_case");
    expect(toSnakeCase("someHTML")).toBe("some_html");
    expect(toSnakeCase("JSONData")).toBe("json_data");
  });

  it("handles special characters", () => {
    expect(toSnakeCase("__dunder__")).toBe("dunder");
    expect(toSnakeCase("  trim  me  ")).toBe("trim_me");
    expect(toSnakeCase("multiple---dashes")).toBe("multiple_dashes");
  });

  it("handles empty string", () => {
    expect(toSnakeCase("")).toBe("");
  });
});
