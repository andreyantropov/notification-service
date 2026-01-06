import { describe, it, expect } from "vitest";

import { createGenerator } from "./createGenerator.js";

describe("createGenerator", () => {
  it("should return a function", () => {
    const generator = createGenerator();
    expect(typeof generator).toBe("function");
  });

  it("should return a string when called", () => {
    const generator = createGenerator();
    const id = generator();
    expect(typeof id).toBe("string");
  });

  it("should return a non-empty string", () => {
    const generator = createGenerator();
    const id = generator();
    expect(id).toBeTruthy();
    expect(id.length).toBeGreaterThan(0);
  });

  it("should generate different IDs on each call", () => {
    const generator = createGenerator();
    const id1 = generator();
    const id2 = generator();
    expect(id1).not.toBe(id2);
  });

  it("should return a valid UUID v4 format", () => {
    const generator = createGenerator();
    const id = generator();
    const uuidV4Regex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    expect(id).toMatch(uuidV4Regex);
  });
});
