import { describe, expect, it } from "vitest";

import { createIdGenerator } from "./createIdGenerator.js";

describe("createIdGenerator", () => {
  it("should return an object with generateId method", () => {
    const idGenerator = createIdGenerator();
    expect(idGenerator).toBeInstanceOf(Object);
    expect(typeof idGenerator.generateId).toBe("function");
  });

  it("should return a string when generateId is called", () => {
    const idGenerator = createIdGenerator();
    const id = idGenerator.generateId();
    expect(typeof id).toBe("string");
  });

  it("should return a non-empty string", () => {
    const idGenerator = createIdGenerator();
    const id = idGenerator.generateId();
    expect(id).toBeTruthy();
    expect(id.length).toBeGreaterThan(0);
  });

  it("should generate different IDs on each call", () => {
    const idGenerator = createIdGenerator();
    const id1 = idGenerator.generateId();
    const id2 = idGenerator.generateId();
    expect(id1).not.toBe(id2);
  });

  it("should return a valid UUID v4 format", () => {
    const idGenerator = createIdGenerator();
    const id = idGenerator.generateId();
    const uuidV4Regex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    expect(id).toMatch(uuidV4Regex);
  });
});
