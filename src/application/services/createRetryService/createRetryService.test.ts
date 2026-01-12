import { describe, it, expect } from "vitest";

import {
  NOTIFICATIONS_DQL,
  NOTIFICATIONS_RETRY_30M,
  NOTIFICATIONS_RETRY_2H,
} from "./constants/index.js";
import { createRetryService } from "./createRetryService.js";

describe("RetryService", () => {
  const service = createRetryService();

  it("should return 30-minute retry queue for retry count 1", () => {
    expect(service.getRetryQueue(1)).toBe(NOTIFICATIONS_RETRY_30M);
  });

  it("should return 2-hour retry queue for retry count 2", () => {
    expect(service.getRetryQueue(2)).toBe(NOTIFICATIONS_RETRY_2H);
  });

  it("should return DQL for retry count 3", () => {
    expect(service.getRetryQueue(3)).toBe(NOTIFICATIONS_DQL);
  });

  it("should return DQL for retry count greater than 2", () => {
    expect(service.getRetryQueue(5)).toBe(NOTIFICATIONS_DQL);
  });

  it("should return DQL for retry count 0", () => {
    expect(service.getRetryQueue(0)).toBe(NOTIFICATIONS_DQL);
  });

  it("should return DQL for negative retry count", () => {
    expect(service.getRetryQueue(-1)).toBe(NOTIFICATIONS_DQL);
  });
});
