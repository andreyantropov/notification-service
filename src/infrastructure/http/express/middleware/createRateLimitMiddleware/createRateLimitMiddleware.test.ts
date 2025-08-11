import { describe, it, beforeEach, vi } from "vitest";
import request from "supertest";
import express from "express";
import { createRateLimiter } from "./createRateLimitMiddleware.js";

describe("RateLimitMiddleware", () => {
  let app: express.Express;

  beforeEach(() => {
    app = express();

    const rateLimiter = createRateLimiter(60_000, 100);

    app.get("/test", rateLimiter, (_req, res) => {
      res.json({ message: "Success" });
    });
  });

  it("should allow up to 100 requests within 60 seconds", async () => {
    for (let i = 0; i < 100; i++) {
      await request(app).get("/test").expect(200);
    }

    await request(app).get("/test").expect(429).expect({
      error: "HTTP 429 Too Many Requests",
      message: "Превышен лимит запросов, попробуйте через минуту",
    });
  });

  it("should reset rate limit after windowMs (60 seconds)", async () => {
    vi.useFakeTimers();

    for (let i = 0; i < 100; i++) {
      await request(app).get("/test").expect(200);
    }

    await request(app).get("/test").expect(429);

    vi.advanceTimersByTime(60_000);

    await request(app).get("/test").expect(200).expect({ message: "Success" });

    vi.useRealTimers();
  });
});
