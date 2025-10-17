import { describe, it, expect } from "vitest";

import { uuidIdGenerator } from "./uuidIdGenerator.js";

describe("uuidIdGenerator", () => {
  it("should return a string", () => {
    const id = uuidIdGenerator();
    expect(typeof id).toBe("string");
  });

  it("should return a non-empty string", () => {
    const id = uuidIdGenerator();
    expect(id).toBeTruthy();
    expect(id.length).toBeGreaterThan(0);
  });

  it("should generate different IDs on each call", () => {
    const id1 = uuidIdGenerator();
    const id2 = uuidIdGenerator();
    expect(id1).not.toBe(id2);
  });

  it("should return a valid UUID v4 format", () => {
    const id = uuidIdGenerator();
    const uuidV4Regex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    expect(id).toMatch(uuidV4Regex);
  });
});
