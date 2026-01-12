import { describe, it, expect, vi } from "vitest";

import { createLoggedRetryService } from "./createLoggedRetryService.js";
import { EventType } from "../../../../enums/EventType.js";
import type { Logger } from "../../../../ports/index.js";
import type { Log } from "../../../../types/Log.js";
import { NOTIFICATIONS_DQL } from "../../constants/constants.js";
import type { RetryService } from "../../interfaces/RetryService.js";

describe("createLoggedRetryService", () => {
  const mockRetryService = (returnValue: string): RetryService => ({
    getRetryQueue: vi.fn().mockReturnValue(returnValue),
  });

  const createMockLogger = () => ({
    error: vi.fn<(payload: Log) => void>(),
    warning: vi.fn<(payload: Log) => void>(),
  });

  it("logs to warning and returns correct queue when retryCount matches a retry level", () => {
    const retryQueue = "notifications.retry.30m";
    const retryService = mockRetryService(retryQueue);
    const logger = createMockLogger();

    const loggedRetryService = createLoggedRetryService({
      retryService,
      logger: logger as unknown as Logger,
    });

    const retryCount = 1;
    const result = loggedRetryService.getRetryQueue(retryCount);

    expect(result).toBe(retryQueue);
    expect(retryService.getRetryQueue).toHaveBeenCalledWith(retryCount);
    expect(logger.warning).toHaveBeenCalledTimes(1);
    expect(logger.error).not.toHaveBeenCalled();

    const logCall = logger.warning.mock.calls[0]?.[0];
    expect(logCall).toBeDefined();
    expect(logCall.message).toBe(
      `Уведомление отправлено в retry-очередь ${retryQueue}`,
    );
    expect(logCall.eventType).toBe(EventType.MessagePublish);
    expect(logCall.durationMs).toBeTypeOf("number");
    expect(logCall.durationMs).toBeGreaterThanOrEqual(0);
    expect(logCall.details).toEqual({
      retryCount,
      target: retryQueue,
    });
  });

  it("logs to error and returns DLQ when retryCount exceeds configured levels", () => {
    const retryService = mockRetryService(NOTIFICATIONS_DQL);
    const logger = createMockLogger();
    const retryCount = 999;

    const loggedRetryService = createLoggedRetryService({
      retryService,
      logger: logger as unknown as Logger,
    });

    const result = loggedRetryService.getRetryQueue(retryCount);

    expect(result).toBe(NOTIFICATIONS_DQL);
    expect(retryService.getRetryQueue).toHaveBeenCalledWith(retryCount);
    expect(logger.error).toHaveBeenCalledTimes(1);
    expect(logger.warning).not.toHaveBeenCalled();

    const logCall = logger.error.mock.calls[0]?.[0];
    expect(logCall).toBeDefined();
    expect(logCall.message).toBe(
      `Уведомление отправлено в retry-очередь ${NOTIFICATIONS_DQL}`,
    );
    expect(logCall.eventType).toBe(EventType.MessagePublish);
    expect(logCall.durationMs).toBeTypeOf("number");
    expect(logCall.durationMs).toBeGreaterThanOrEqual(0);
    expect(logCall.details).toEqual({
      retryCount,
      target: NOTIFICATIONS_DQL,
    });
  });

  it("measures non-negative duration correctly", () => {
    const retryQueue = "notifications.retry.2h";
    const retryService = mockRetryService(retryQueue);
    const logger = createMockLogger();

    const loggedRetryService = createLoggedRetryService({
      retryService,
      logger: logger as unknown as Logger,
    });

    loggedRetryService.getRetryQueue(2);

    const logCall = logger.warning.mock.calls[0]?.[0];
    expect(logCall.durationMs).toBeGreaterThanOrEqual(0);
  });
});
