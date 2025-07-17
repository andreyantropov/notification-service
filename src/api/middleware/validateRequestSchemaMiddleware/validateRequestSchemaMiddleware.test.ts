import { describe, it, expect, vi, beforeEach } from "vitest";
import { Request, Response, NextFunction } from "express";
import { createValidateRequestSchemaMiddleware } from "./validateRequestSchemaMiddleware.js";
import { NotificationRequest } from "../../dtos/NotificationDTO.js";

describe("ValidateNotificationRequestSchemaMiddleware", () => {
  const validateSchema = createValidateRequestSchemaMiddleware({
    schema: NotificationRequest,
  });

  const req = {} as Request;
  const res = {} as Response;
  let next: NextFunction;

  beforeEach(() => {
    vi.clearAllMocks();
    next = vi.fn();
    res.status = vi.fn().mockReturnThis();
    res.json = vi.fn();
  });

  it("should call next() if body is valid", () => {
    req.body = {
      recipients: [
        { type: "email", value: "test@example.com" },
        { type: "bitrix", value: 123 },
      ],
      message: "Hello",
    };

    validateSchema(req, res, next);

    expect(req.body).toEqual({
      recipients: [
        { type: "email", value: "test@example.com" },
        { type: "bitrix", value: 123 },
      ],
      message: "Hello",
    });
    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
  });

  it("should return 400 if validation fails with ZodError", () => {
    req.body = {
      recipients: [
        { type: "email", value: "not-an-email" },
        { type: "bitrix", value: "not-a-number" },
      ],
      message: 123,
    };

    validateSchema(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: "HTTP 400 Bad Request",
      message: "Некорректное тело запроса",
      details: expect.arrayContaining([
        expect.objectContaining({
          path: ["recipients", 0, "value"],
          message: expect.stringContaining("Invalid email"),
        }),
        expect.objectContaining({
          path: ["recipients", 1, "value"],
          message: expect.stringContaining("Expected number"),
        }),
        expect.objectContaining({
          path: ["message"],
          message: expect.stringContaining("Expected string"),
        }),
      ]),
    });
  });
});
