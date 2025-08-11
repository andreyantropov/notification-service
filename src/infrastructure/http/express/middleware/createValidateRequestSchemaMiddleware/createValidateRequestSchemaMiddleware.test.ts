import { describe, it, expect, vi, beforeEach } from "vitest";
import { Request, Response, NextFunction } from "express";
import { createValidateRequestSchemaMiddleware } from "./createValidateRequestSchemaMiddleware.js";
import { NotificationRequest } from "../../dtos/NotificationDTO.js";
import z from "zod";

describe("createValidateRequestSchemaMiddleware", () => {
  const validateSchema =
    createValidateRequestSchemaMiddleware(NotificationRequest);

  const req = {} as Request & { validatedBody?: unknown };
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
    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
  });

  it("should return 400 and error response if validation fails with ZodError", () => {
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
          path: expect.arrayContaining(["recipients", 0, "value"]),
          message: expect.stringContaining("email"),
        }),
        expect.objectContaining({
          path: expect.arrayContaining(["recipients", 1, "value"]),
          message: expect.stringContaining("number"),
        }),
        expect.objectContaining({
          path: expect.arrayContaining(["message"]),
          message: expect.stringContaining("string"),
        }),
      ]),
    });
  });

  it("should re-throw non-Zod errors", () => {
    const originalError = new Error("Unexpected error");
    const spy = vi
      .spyOn(NotificationRequest, "parse")
      .mockImplementation(() => {
        throw originalError;
      });

    req.body = { message: "test" };

    expect(() => validateSchema(req, res, next)).toThrow(originalError);

    spy.mockRestore();
  });

  it("should strip unknown fields from body during parsing", () => {
    const rawBody = {
      recipients: [
        { type: "email", value: "user@example.com" },
        { type: "bitrix", value: 456 },
      ],
      message: "Test message",
      extraField: "I am not allowed",
      debugInfo: { stack: "trace" },
      timestamp: "2025-04-05",
      hidden: true,
    };

    req.body = rawBody;

    validateSchema(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();

    type ParsedType = z.infer<typeof NotificationRequest>;

    expect(req.validatedBody).toEqual<ParsedType>({
      recipients: [
        { type: "email", value: "user@example.com" },
        { type: "bitrix", value: 456 },
      ],
      message: "Test message",
    });

    const parsedBody = req.validatedBody as unknown as Record<string, unknown>;
    expect("extraField" in parsedBody).toBe(false);
    expect("debugInfo" in parsedBody).toBe(false);
    expect("timestamp" in parsedBody).toBe(false);
    expect("hidden" in parsedBody).toBe(false);
  });
});
