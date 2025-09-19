import express from "express";
import request from "supertest";
import { describe, it, beforeEach } from "vitest";

import { createRateLimiterMiddleware } from "./createRateLimiterMiddleware.js";

describe("RateLimiterMiddleware", () => {
  let app: express.Express;

  beforeEach(() => {
    app = express();

    const rateLimiter = createRateLimiterMiddleware({
      time: 60_000,
      tries: 100,
    });

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

  it.skip("should reset rate limit after windowMs (60 seconds)", async () => {
    console.warn(
      "Тест 'should reset rate limit after windowMs' пропущен, потому что express-rate-limit несовместим с vi.useFakeTimers().",
    );
  });
});
