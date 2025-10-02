import { describe, it, expect, vi, beforeEach, Mocked } from "vitest";

import { createTracedSender } from "./createTracedSender.js";
import type { TrasedSenderDependencies } from "./interfaces/TracedSenderDependencies.js";
import { TracingContextManager } from "../../../../application/ports/TracingContextManager.js";
import type { Sender } from "../../../../domain/ports/Sender.js";
import type { Recipient } from "../../../../domain/types/Recipient.js";

describe("createTracedSender", () => {
  let mockSender: Mocked<Sender>;
  let mockTracingContextManager: Mocked<TracingContextManager>;
  let dependencies: TrasedSenderDependencies;
  let recipient: Recipient;
  const message = "test message";

  beforeEach(() => {
    mockSender = {
      type: "email",
      isSupports: vi.fn(),
      send: vi.fn(),
      checkHealth: vi.fn(),
    } as unknown as Mocked<Sender>;

    mockTracingContextManager = {
      startActiveSpan: vi.fn(),
      active: vi.fn(),
      with: vi.fn(),
      getTraceContext: vi.fn(),
    } as Mocked<TracingContextManager>;

    dependencies = {
      sender: mockSender,
      tracingContextManager: mockTracingContextManager,
    };

    recipient = {
      type: "email",
      value: "test@example.com",
    };

    vi.clearAllMocks();
  });

  describe("send method", () => {
    it("should wrap sender.send call with tracing span", async () => {
      const tracedSender = createTracedSender(dependencies);

      mockTracingContextManager.startActiveSpan.mockImplementation(
        async (name, options, fn) => {
          return fn({
            recordException: vi.fn(),
            setStatus: vi.fn(),
          });
        },
      );

      await tracedSender.send(recipient, message);

      expect(mockTracingContextManager.startActiveSpan).toHaveBeenCalledWith(
        "email.send",
        {
          kind: "CLIENT",
          attributes: {
            "sender.type": "email",
            "recipient.type": "email",
            "recipient.value": "test@example.com",
          },
        },
        expect.any(Function),
      );

      expect(mockSender.send).toHaveBeenCalledWith(recipient, message);
    });

    it("should propagate send method result through tracing span", async () => {
      const tracedSender = createTracedSender(dependencies);
      const expectedResult = undefined;

      mockTracingContextManager.startActiveSpan.mockImplementation(
        async (name, options, fn) => {
          return fn({
            recordException: vi.fn(),
            setStatus: vi.fn(),
          });
        },
      );

      const result = await tracedSender.send(recipient, message);

      expect(result).toBe(expectedResult);
    });

    it("should handle errors from sender.send within tracing span", async () => {
      const tracedSender = createTracedSender(dependencies);
      const testError = new Error("Send failed");

      mockSender.send.mockRejectedValue(testError);

      mockTracingContextManager.startActiveSpan.mockImplementation(
        async (name, options, fn) => {
          return await fn({
            recordException: vi.fn().mockImplementation(() => {}),
            setStatus: vi.fn().mockImplementation(() => {}),
          });
        },
      );

      await expect(tracedSender.send(recipient, message)).rejects.toThrow(
        "Send failed",
      );

      expect(mockSender.send).toHaveBeenCalledWith(recipient, message);
    });

    it("should include recipient attributes in span", async () => {
      const tracedSender = createTracedSender(dependencies);

      mockTracingContextManager.startActiveSpan.mockImplementation(
        async (name, options, fn) => {
          return fn({
            recordException: vi.fn(),
            setStatus: vi.fn(),
          });
        },
      );

      const customRecipient: Recipient = {
        type: "bitrix",
        value: 99999,
      };

      await tracedSender.send(customRecipient, message);

      expect(mockTracingContextManager.startActiveSpan).toHaveBeenCalledWith(
        "email.send",
        expect.objectContaining({
          attributes: expect.objectContaining({
            "recipient.type": "bitrix",
            "recipient.value": 99999,
          }),
        }),
        expect.any(Function),
      );
    });
  });

  describe("checkHealth method", () => {
    it("should wrap sender.checkHealth call with tracing span when checkHealth exists", async () => {
      const tracedSender = createTracedSender(dependencies);

      mockTracingContextManager.startActiveSpan.mockImplementation(
        async (name, options, fn) => {
          return fn({
            recordException: vi.fn(),
            setStatus: vi.fn(),
          });
        },
      );

      await tracedSender.checkHealth!();

      expect(mockTracingContextManager.startActiveSpan).toHaveBeenCalledWith(
        "email.checkHealth",
        {
          kind: "CLIENT",
        },
        expect.any(Function),
      );

      expect(mockSender.checkHealth).toHaveBeenCalled();
    });

    it("should not create checkHealth method when sender does not have checkHealth", () => {
      const senderWithoutHealthCheck = {
        ...mockSender,
        checkHealth: undefined,
      };

      const dependenciesWithoutHealthCheck = {
        ...dependencies,
        sender: senderWithoutHealthCheck,
      };

      const tracedSender = createTracedSender(dependenciesWithoutHealthCheck);

      expect(tracedSender.checkHealth).toBeUndefined();
    });

    it("should propagate checkHealth result through tracing span", async () => {
      const tracedSender = createTracedSender(dependencies);

      mockTracingContextManager.startActiveSpan.mockImplementation(
        async (name, options, fn) => {
          return fn({
            recordException: vi.fn(),
            setStatus: vi.fn(),
          });
        },
      );

      const result = await tracedSender.checkHealth!();

      expect(result).toBeUndefined();
      expect(mockSender.checkHealth).toHaveBeenCalled();
    });
  });

  describe("isSupports method", () => {
    it("should delegate isSupports calls to the underlying sender", () => {
      const tracedSender = createTracedSender(dependencies);

      const testRecipient: Recipient = {
        type: "bitrix",
        value: 99999,
      };

      mockSender.isSupports.mockReturnValue(true);

      const result = tracedSender.isSupports(testRecipient);

      expect(mockSender.isSupports).toHaveBeenCalledWith(testRecipient);
      expect(result).toBe(true);
    });

    it("should not wrap isSupports calls with tracing spans", () => {
      const tracedSender = createTracedSender(dependencies);

      const testRecipient: Recipient = {
        type: "bitrix",
        value: 99999,
      };

      tracedSender.isSupports(testRecipient);

      expect(mockTracingContextManager.startActiveSpan).not.toHaveBeenCalled();
      expect(mockSender.isSupports).toHaveBeenCalledWith(testRecipient);
    });
  });

  describe("returned sender interface", () => {
    it("should return an object with correct methods", () => {
      const tracedSender = createTracedSender(dependencies);

      expect(tracedSender).toHaveProperty("type", "email");
      expect(tracedSender).toHaveProperty("isSupports");
      expect(tracedSender).toHaveProperty("send");
      expect(tracedSender).toHaveProperty("checkHealth");
      expect(typeof tracedSender.isSupports).toBe("function");
      expect(typeof tracedSender.send).toBe("function");
      expect(typeof tracedSender.checkHealth).toBe("function");
    });

    it("should maintain the same isSupports implementation as original sender", () => {
      const originalIsSupports = vi.fn();
      const customSender = {
        type: "bitrix",
        isSupports: originalIsSupports,
        send: vi.fn(),
        checkHealth: vi.fn(),
      } as unknown as Sender;

      const customDependencies = {
        ...dependencies,
        sender: customSender,
      };

      const tracedSender = createTracedSender(customDependencies);
      const testRecipient: Recipient = {
        type: "email",
        value: "test@test.com",
      };

      tracedSender.isSupports(testRecipient);

      expect(originalIsSupports).toHaveBeenCalledWith(testRecipient);
    });
  });
});
