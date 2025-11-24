import { describe, it, expect } from "vitest";

import { createNotificationRetryService } from "./createNotificationRetryService.js";

describe("NotificationRetryService", () => {
  const service = createNotificationRetryService();

  it("should return 'retry-1' queue for retry count 1", () => {
    const queue = service.getRetryQueue(1);
    expect(queue).toBe("retry-1");
  });

  it("should return 'retry-2' queue for retry count 2", () => {
    const queue = service.getRetryQueue(2);
    expect(queue).toBe("retry-2");
  });

  it("should return 'dlq' queue for retry count 3", () => {
    const queue = service.getRetryQueue(3);
    expect(queue).toBe("dlq");
  });

  it("should return 'dlq' queue for retry count greater than 2", () => {
    const queue = service.getRetryQueue(5);
    expect(queue).toBe("dlq");
  });

  it("should return 'dlq' queue for retry count 0", () => {
    const queue = service.getRetryQueue(0);
    expect(queue).toBe("dlq");
  });

  it("should return 'dlq' queue for negative retry count", () => {
    const queue = service.getRetryQueue(-1);
    expect(queue).toBe("dlq");
  });
});
