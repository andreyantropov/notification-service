import { beforeEach, describe, expect, it, vi } from "vitest";

import { type Channel } from "../../../../domain/ports/index.js";
import { CHANNEL_TYPE, type Contact } from "../../../../domain/types/index.js";
import { SPAN_KIND, type Tracer } from "../../../telemetry/index.js";

import { type TracingDecoratorDependencies } from "./interfaces/index.js";
import { withTracingDecorator } from "./withTracingDecorator.js";

describe("withTracingDecorator (Channel)", () => {
  let mockChannel: Channel;
  let mockTracer: Tracer;

  const mockContact: Contact = {
    type: CHANNEL_TYPE.EMAIL,
    value: "trace@test.com",
  };
  const mockMessage = "Tracing message";

  beforeEach(() => {
    vi.clearAllMocks();

    mockTracer = {
      startActiveSpan: vi.fn().mockImplementation((_name, fn) => fn()),
      continueTrace: vi.fn().mockImplementation((_headers, fn) => fn()),
      getTraceHeaders: vi.fn().mockReturnValue({}),
    };

    mockChannel = {
      type: CHANNEL_TYPE.EMAIL,
      send: vi.fn().mockResolvedValue(undefined),
      isSupports: vi.fn().mockReturnValue(true),
    } as unknown as Channel;
  });

  const getDeps = (): TracingDecoratorDependencies => ({
    channel: mockChannel,
    tracer: mockTracer,
  });

  it("should start active span with correct parameters when sending", async () => {
    const decorated = withTracingDecorator(getDeps());

    await decorated.send(mockContact, mockMessage);

    expect(mockTracer.startActiveSpan).toHaveBeenCalledWith(
      "notification.send_to_channel",
      expect.any(Function),
      {
        kind: SPAN_KIND.CLIENT,
        attributes: {
          channel: CHANNEL_TYPE.EMAIL,
          contact: CHANNEL_TYPE.EMAIL,
        },
      },
    );
    expect(mockChannel.send).toHaveBeenCalledWith(mockContact, mockMessage);
  });

  it("should propagate errors from channel and close span (via tracer)", async () => {
    const error = new Error("Tracing failed");
    vi.mocked(mockChannel.send).mockRejectedValue(error);

    const decorated = withTracingDecorator(getDeps());

    await expect(decorated.send(mockContact, mockMessage)).rejects.toThrow(
      error,
    );
    expect(mockTracer.startActiveSpan).toHaveBeenCalled();
  });

  it("should preserve original channel properties", () => {
    const decorated = withTracingDecorator(getDeps());

    expect(decorated.type).toBe(CHANNEL_TYPE.EMAIL);
    expect(decorated.isSupports(mockContact)).toBe(true);
    expect(mockChannel.isSupports).toHaveBeenCalledWith(mockContact);
  });
});
