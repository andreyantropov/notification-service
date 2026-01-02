import { describe, it, expect } from "vitest";

import { extractSubjectFromToken } from "./extractSubjectFromToken.js";
import type { Subject } from "../../../domain/types/index.js";

describe("extractSubjectFromToken", () => {
  it("should return a Subject with id and name from preferred_username when preferred_username is present", () => {
    const payload = {
      sub: "user123",
      preferred_username: "johndoe",
      name: "John Doe",
    };

    const result = extractSubjectFromToken(payload);

    const expected: Subject = {
      id: "user123",
      name: "johndoe",
    };

    expect(result).toEqual(expected);
  });

  it("should return a Subject with id and name from name when preferred_username is absent", () => {
    const payload = {
      sub: "user456",
      name: "Jane Smith",
    };

    const result = extractSubjectFromToken(payload);

    const expected: Subject = {
      id: "user456",
      name: "Jane Smith",
    };

    expect(result).toEqual(expected);
  });

  it("should use name when preferred_username is absent", () => {
    const payload = {
      sub: "user789",
      name: "Bob Johnson",
    };

    const result = extractSubjectFromToken(payload);
    expect(result).toEqual({ id: "user789", name: "Bob Johnson" });
  });

  it("should return a Subject with id and name from name when preferred_username is null", () => {
    const payload = {
      sub: "user101",
      preferred_username: null,
      name: "Alice Brown",
    };

    expect(() => extractSubjectFromToken(payload)).toThrow(
      "Не удалось извлечь данные об отправителе запроса:",
    );
  });

  it("should throw an error if sub is missing", () => {
    const payload = {
      preferred_username: "testuser",
      name: "Test User",
    };

    expect(() => extractSubjectFromToken(payload)).toThrow(
      "Не удалось извлечь данные об отправителе запроса:",
    );
  });

  it("should throw an error if sub is an empty string after trimming", () => {
    const payload = {
      sub: "  ",
      preferred_username: "validuser",
      name: "Valid User",
    };

    expect(() => extractSubjectFromToken(payload)).toThrow(
      "Не удалось извлечь данные об отправителе запроса:",
    );
  });

  it("should throw an error if sub exceeds max length", () => {
    const longSub = "a".repeat(257);
    const payload = {
      sub: longSub,
      preferred_username: "validuser",
      name: "Valid User",
    };

    expect(() => extractSubjectFromToken(payload)).toThrow(
      "Не удалось извлечь данные об отправителе запроса:",
    );
  });

  it("should throw an error if preferred_username is too short (less than 2 chars after trimming)", () => {
    const payload = {
      sub: "user112",
      preferred_username: "a",
      name: "Valid User",
    };

    expect(() => extractSubjectFromToken(payload)).toThrow(
      "Не удалось извлечь данные об отправителе запроса:",
    );
  });

  it("should throw an error if name is too short (less than 2 chars after trimming)", () => {
    const payload = {
      sub: "user113",
      preferred_username: "validuser",
      name: "B",
    };

    expect(() => extractSubjectFromToken(payload)).toThrow(
      "Не удалось извлечь данные об отправителе запроса:",
    );
  });

  it("should throw an error if payload is not an object", () => {
    const payload = "not an object";

    expect(() => extractSubjectFromToken(payload)).toThrow(
      "Не удалось извлечь данные об отправителе запроса:",
    );
  });

  it("should throw an error if payload is null", () => {
    const payload: unknown = null;

    expect(() => extractSubjectFromToken(payload)).toThrow(
      "Не удалось извлечь данные об отправителе запроса:",
    );
  });

  it("should throw an error if payload is an array", () => {
    const payload = [1, 2, 3];

    expect(() => extractSubjectFromToken(payload)).toThrow(
      "Не удалось извлечь данные об отправителе запроса:",
    );
  });

  it("should return a Subject with id and name from preferred_username even if name is also present, and preferred_username meets min length", () => {
    const payload = {
      sub: "user114",
      preferred_username: "johnny",
      name: "John Doe The Real Name",
    };

    const result = extractSubjectFromToken(payload);

    const expected: Subject = {
      id: "user114",
      name: "johnny",
    };

    expect(result).toEqual(expected);
  });

  it("should return a Subject with trimmed sub, preferred_username, and name", () => {
    const payload = {
      sub: "  user115  ",
      preferred_username: "  janesmith  ",
      name: "  Jane T. Doe  ",
    };

    const result = extractSubjectFromToken(payload);

    const expected: Subject = {
      id: "user115",
      name: "janesmith",
    };

    expect(result).toEqual(expected);
  });
});
