import { describe, it, expect, vi, beforeEach, Mocked } from "vitest";

import { createTracedChannel } from "./createTracedChannel.js";
import type { TrasedChannelDependencies } from "./interfaces/index.js";
import type { Tracer } from "../../../../application/ports/index.js";
import { CHANNEL_TYPES } from "../../../../domain/constants/index.js";
import type { Channel } from "../../../../domain/ports/index.js";
import type { Contact } from "../../../../domain/types/index.js";

describe("createTracedChannel", () => {
  let mockChannel: Mocked<Channel>;
  let tracer: Mocked<Tracer>;
  let dependencies: TrasedChannelDependencies;
  let contact: Contact;
  const message = "test message";

  beforeEach(() => {
    mockChannel = {
      type: CHANNEL_TYPES.EMAIL,
      isSupports: vi.fn(),
      send: vi.fn(),
      checkHealth: vi.fn(),
    } as unknown as Mocked<Channel>;

    tracer = {
      startActiveSpan: vi.fn(),
      active: vi.fn(),
      with: vi.fn(),
      getTraceContext: vi.fn(),
    } as Mocked<Tracer>;

    dependencies = {
      channel: mockChannel,
      tracer: tracer,
    };

    contact = {
      type: CHANNEL_TYPES.EMAIL,
      value: "test@example.com",
    };

    vi.clearAllMocks();
  });

  describe("send method", () => {
    it("should wrap channel.send call with tracing span", async () => {
      const tracedChannel = createTracedChannel(dependencies);

      tracer.startActiveSpan.mockImplementation(async (name, options, fn) => {
        return fn({
          recordException: vi.fn(),
          setStatus: vi.fn(),
        });
      });

      await tracedChannel.send(contact, message);

      expect(tracer.startActiveSpan).toHaveBeenCalledWith(
        "email.send",
        {
          kind: "CLIENT",
          attributes: {
            channelType: CHANNEL_TYPES.EMAIL,
            contactType: CHANNEL_TYPES.EMAIL,
          },
        },
        expect.any(Function),
      );

      expect(mockChannel.send).toHaveBeenCalledWith(contact, message);
    });

    it("should propagate send method result through tracing span", async () => {
      const tracedChannel = createTracedChannel(dependencies);
      const expectedResult = undefined;

      tracer.startActiveSpan.mockImplementation(async (name, options, fn) => {
        return fn({
          recordException: vi.fn(),
          setStatus: vi.fn(),
        });
      });

      const result = await tracedChannel.send(contact, message);

      expect(result).toBe(expectedResult);
    });

    it("should handle errors from channel.send within tracing span", async () => {
      const tracedChannel = createTracedChannel(dependencies);
      const testError = new Error("Send failed");

      mockChannel.send.mockRejectedValue(testError);

      tracer.startActiveSpan.mockImplementation(async (name, options, fn) => {
        return await fn({
          recordException: vi.fn().mockImplementation(() => {}),
          setStatus: vi.fn().mockImplementation(() => {}),
        });
      });

      await expect(tracedChannel.send(contact, message)).rejects.toThrow(
        "Send failed",
      );

      expect(mockChannel.send).toHaveBeenCalledWith(contact, message);
    });

    it("should include contact attributes in span", async () => {
      const tracedChannel = createTracedChannel(dependencies);

      tracer.startActiveSpan.mockImplementation(async (name, options, fn) => {
        return fn({
          recordException: vi.fn(),
          setStatus: vi.fn(),
        });
      });

      const customContact: Contact = {
        type: CHANNEL_TYPES.BITRIX,
        value: 99999,
      };

      await tracedChannel.send(customContact, message);

      expect(tracer.startActiveSpan).toHaveBeenCalledWith(
        "email.send",
        expect.objectContaining({
          attributes: expect.objectContaining({
            contactType: CHANNEL_TYPES.BITRIX,
          }),
        }),
        expect.any(Function),
      );
    });
  });

  describe("checkHealth method", () => {
    it("should wrap channel.checkHealth call with tracing span when checkHealth exists", async () => {
      const tracedChannel = createTracedChannel(dependencies);

      tracer.startActiveSpan.mockImplementation(async (name, options, fn) => {
        return fn({
          recordException: vi.fn(),
          setStatus: vi.fn(),
        });
      });

      await tracedChannel.checkHealth!();

      expect(tracer.startActiveSpan).toHaveBeenCalledWith(
        "email.checkHealth",
        {
          kind: "CLIENT",
        },
        expect.any(Function),
      );

      expect(mockChannel.checkHealth).toHaveBeenCalled();
    });

    it("should not create checkHealth method when channel does not have checkHealth", () => {
      const channelWithoutHealthCheck = {
        ...mockChannel,
        checkHealth: undefined,
      };

      const dependenciesWithoutHealthCheck = {
        ...dependencies,
        channel: channelWithoutHealthCheck,
      };

      const tracedChannel = createTracedChannel(dependenciesWithoutHealthCheck);

      expect(tracedChannel.checkHealth).toBeUndefined();
    });

    it("should propagate checkHealth result through tracing span", async () => {
      const tracedChannel = createTracedChannel(dependencies);

      tracer.startActiveSpan.mockImplementation(async (name, options, fn) => {
        return fn({
          recordException: vi.fn(),
          setStatus: vi.fn(),
        });
      });

      const result = await tracedChannel.checkHealth!();

      expect(result).toBeUndefined();
      expect(mockChannel.checkHealth).toHaveBeenCalled();
    });
  });

  describe("isSupports method", () => {
    it("should delegate isSupports calls to the underlying channel", () => {
      const tracedChannel = createTracedChannel(dependencies);

      const testContact: Contact = {
        type: CHANNEL_TYPES.BITRIX,
        value: 99999,
      };

      mockChannel.isSupports.mockReturnValue(true);

      const result = tracedChannel.isSupports(testContact);

      expect(mockChannel.isSupports).toHaveBeenCalledWith(testContact);
      expect(result).toBe(true);
    });

    it("should not wrap isSupports calls with tracing spans", () => {
      const tracedChannel = createTracedChannel(dependencies);

      const testContact: Contact = {
        type: CHANNEL_TYPES.BITRIX,
        value: 99999,
      };

      tracedChannel.isSupports(testContact);

      expect(tracer.startActiveSpan).not.toHaveBeenCalled();
      expect(mockChannel.isSupports).toHaveBeenCalledWith(testContact);
    });
  });

  describe("returned channel interface", () => {
    it("should return an object with correct methods", () => {
      const tracedChannel = createTracedChannel(dependencies);

      expect(tracedChannel).toHaveProperty("type", CHANNEL_TYPES.EMAIL);
      expect(tracedChannel).toHaveProperty("isSupports");
      expect(tracedChannel).toHaveProperty("send");
      expect(tracedChannel).toHaveProperty("checkHealth");
      expect(typeof tracedChannel.isSupports).toBe("function");
      expect(typeof tracedChannel.send).toBe("function");
      expect(typeof tracedChannel.checkHealth).toBe("function");
    });

    it("should maintain the same isSupports implementation as original channel", () => {
      const originalIsSupports = vi.fn();
      const customChannel = {
        type: CHANNEL_TYPES.BITRIX,
        isSupports: originalIsSupports,
        send: vi.fn(),
        checkHealth: vi.fn(),
      } as unknown as Channel;

      const customDependencies = {
        ...dependencies,
        channel: customChannel,
      };

      const tracedChannel = createTracedChannel(customDependencies);
      const testContact: Contact = {
        type: CHANNEL_TYPES.EMAIL,
        value: "test@test.com",
      };

      tracedChannel.isSupports(testContact);

      expect(originalIsSupports).toHaveBeenCalledWith(testContact);
    });
  });
});
