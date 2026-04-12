import { beforeEach, describe, expect, it, vi } from "vitest";

import { type Channel } from "../../../../domain/ports/index.js";
import { type Contact } from "../../../../domain/types/index.js";
import {
  EVENT_TYPE,
  type Logger,
  TRIGGER_TYPE,
} from "../../../telemetry/index.js";

import { type LoggingDecoratorDependencies } from "./interfaces/index.js";
import { withLoggingDecorator } from "./withLoggingDecorator.js";

describe("withLoggingDecorator (Channel)", () => {
  let mockChannel: Channel;
  let mockLogger: Logger;

  const mockContact: Contact = { type: "email", value: "test@test.com" };
  const mockMessage = "Hello test";

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-01-01T00:00:00Z"));

    mockChannel = {
      type: "email",
      isSupports: vi.fn().mockReturnValue(true),
      send: vi.fn().mockResolvedValue(undefined),
    } as unknown as Channel;

    mockLogger = {
      trace: vi.fn().mockResolvedValue(undefined),
      debug: vi.fn().mockResolvedValue(undefined),
      info: vi.fn().mockResolvedValue(undefined),
      warn: vi.fn().mockResolvedValue(undefined),
      error: vi.fn().mockResolvedValue(undefined),
      fatal: vi.fn().mockResolvedValue(undefined),
    };
  });

  const getDeps = (): LoggingDecoratorDependencies => ({
    channel: mockChannel,
    logger: mockLogger,
  });

  it("should log info on successful send with correct duration and eventName", async () => {
    const decorated = withLoggingDecorator(getDeps());

    const sendPromise = decorated.send(mockContact, mockMessage);
    vi.advanceTimersByTime(120);
    await sendPromise;

    expect(mockChannel.send).toHaveBeenCalledWith(mockContact, mockMessage);
    expect(mockLogger.info).toHaveBeenCalledWith(
      expect.objectContaining({
        message: `Уведомление успешно отправлено по каналу ${mockChannel.type}`,
        eventName: "notification.send_to_channel",
        eventType: EVENT_TYPE.MESSAGING,
        trigger: TRIGGER_TYPE.API,
        durationMs: 120,
        details: {
          type: mockChannel.type,
          contact: mockContact.type,
        },
      }),
    );
  });

  it("should log error and rethrow when send fails", async () => {
    const sendError = new Error("SMTP Timeout");
    vi.mocked(mockChannel.send).mockRejectedValue(sendError);

    const decorated = withLoggingDecorator(getDeps());

    const sendPromise = decorated.send(mockContact, mockMessage);
    vi.advanceTimersByTime(50);

    await expect(sendPromise).rejects.toThrow(sendError);

    expect(mockLogger.error).toHaveBeenCalledWith(
      expect.objectContaining({
        message: `Не удалось отправить уведомление по каналу ${mockChannel.type}`,
        eventName: "notification.send_to_channel",
        durationMs: 50,
        error: sendError,
        details: {
          type: mockChannel.type,
          contact: mockContact.type,
        },
      }),
    );
  });

  it("should preserve all original channel properties and methods", () => {
    const decorated = withLoggingDecorator(getDeps());

    expect(decorated.type).toBe("email");
    expect(typeof decorated.isSupports).toBe("function");

    decorated.isSupports(mockContact);
    expect(mockChannel.isSupports).toHaveBeenCalledWith(mockContact);
  });
});
