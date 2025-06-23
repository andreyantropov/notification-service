import { describe, it, expect, vi } from "vitest";
import { retry } from "./retry.js";

describe("retry", () => {
  const createMockFn = (
    failuresBeforeSuccess: number,
    result: string = "success",
    error: Error = new Error("Failed"),
  ) => {
    let callCount = 0;
    return async () => {
      callCount++;
      if (callCount <= failuresBeforeSuccess) {
        throw error;
      }
      return result;
    };
  };

  it("succeeds on first attempt if function does not throw", async () => {
    const mockFn = vi.fn().mockResolvedValue("success");
    const result = await retry(mockFn, 3);
    expect(result).toBe("success");
    expect(mockFn).toHaveBeenCalledTimes(1);
  });

  it("succeeds after several retries", async () => {
    const mockFn = createMockFn(2);
    const result = await retry(mockFn, 3);
    expect(result).toBe("success");
  });

  it("throws after all attempts are exhausted", async () => {
    const mockFn = createMockFn(3);
    await expect(retry(mockFn, 3)).rejects.toThrow("Failed");
  });

  it("waits longer between each retry (exponential backoff)", async () => {
    const mockFn = createMockFn(2);
    const startTime = Date.now();
    await retry(mockFn, 3);
    const duration = Date.now() - startTime;
    expect(duration).toBeGreaterThanOrEqual(3000); // 1s + 2s
    expect(duration).toBeLessThan(4000);
  });

  it("uses default 1 attempt when maxAttempts not provided", async () => {
    const mockFn = createMockFn(1);
    await expect(retry(mockFn)).rejects.toThrow("Failed");
  });

  it("propagates custom error types", async () => {
    class CustomError extends Error {}
    const mockFn = createMockFn(2, "success", new CustomError("Custom"));
    await expect(retry(mockFn, 2)).rejects.toThrow(CustomError);
  });

  it("does not retry if maxAttempts is 1", async () => {
    const mockFn = createMockFn(1);
    await expect(retry(mockFn, 1)).rejects.toThrow("Failed");
  });

  it("returns correct value after retries", async () => {
    const expected = "special value";
    const mockFn = createMockFn(2, expected);
    const result = await retry(mockFn, 3);
    expect(result).toBe(expected);
  });
});
