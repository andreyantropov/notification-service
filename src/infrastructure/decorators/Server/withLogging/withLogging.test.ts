import { beforeEach, describe, expect, it, vi } from "vitest";

import { type Server } from "../../../http/server/index.js";
import {
  EVENT_TYPE,
  type Logger,
  TRIGGER_TYPE,
} from "../../../telemetry/index.js";

import { type LoggingDependencies } from "./interfaces/index.js";
import { withLogging } from "./withLogging.js";

describe("withLogging", () => {
  let mockServer: Server;
  let mockLogger: Logger;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-01-01T00:00:00Z"));

    mockServer = {
      start: vi.fn().mockResolvedValue(undefined),
      shutdown: vi.fn().mockResolvedValue(undefined),
    } as unknown as Server;

    mockLogger = {
      trace: vi.fn().mockResolvedValue(undefined),
      debug: vi.fn().mockResolvedValue(undefined),
      error: vi.fn().mockResolvedValue(undefined),
      info: vi.fn().mockResolvedValue(undefined),
      warn: vi.fn().mockResolvedValue(undefined),
      fatal: vi.fn().mockResolvedValue(undefined),
    };
  });

  const getDeps = (): LoggingDependencies => ({
    server: mockServer,
    logger: mockLogger,
  });

  describe("start", () => {
    it("should log success with correct duration and eventName when server starts", async () => {
      const decorated = withLogging(getDeps());

      const startPromise = decorated.start();
      vi.advanceTimersByTime(100);
      await startPromise;

      expect(mockServer.start).toHaveBeenCalledTimes(1);
      expect(mockLogger.debug).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Сервер успешно запущен",
          eventName: "server.start",
          eventType: EVENT_TYPE.LIFECYCLE,
          trigger: TRIGGER_TYPE.MANUAL,
          durationMs: 100,
        }),
      );
    });

    it("should log fatal error with duration when server start fails", async () => {
      const startError = new Error("Fatal Start Error");
      vi.mocked(mockServer.start).mockRejectedValue(startError);

      const decorated = withLogging(getDeps());

      const startPromise = decorated.start();
      vi.advanceTimersByTime(50);

      await expect(startPromise).rejects.toThrow(startError);

      expect(mockLogger.fatal).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Не удалось запустить сервер",
          eventName: "server.start",
          durationMs: 50,
          error: startError,
        }),
      );
    });
  });

  describe("shutdown", () => {
    it("should log success with duration and eventName when server stops", async () => {
      const decorated = withLogging(getDeps());

      const shutdownPromise = decorated.shutdown();
      vi.advanceTimersByTime(200);
      await shutdownPromise;

      expect(mockServer.shutdown).toHaveBeenCalledTimes(1);
      expect(mockLogger.debug).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Сервер успешно остановлен",
          eventName: "server.shutdown",
          durationMs: 200,
        }),
      );
    });

    it("should log fatal error and rethrow when shutdown fails", async () => {
      const shutdownError = new Error("Shutdown Failed");
      vi.mocked(mockServer.shutdown).mockRejectedValue(shutdownError);

      const decorated = withLogging(getDeps());

      const shutdownPromise = decorated.shutdown();
      vi.advanceTimersByTime(30);

      await expect(shutdownPromise).rejects.toThrow(shutdownError);

      expect(mockLogger.fatal).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Не удалось остановить сервер",
          eventName: "server.shutdown",
          durationMs: 30,
          error: shutdownError,
        }),
      );
    });
  });

  it("should spread and preserve all original server methods", () => {
    const complexServer = {
      ...mockServer,
      customMethod: vi.fn(),
    } as unknown as Server;

    const decorated = withLogging({
      server: complexServer,
      logger: mockLogger,
    });

    expect(decorated).toHaveProperty("customMethod");
  });
});
