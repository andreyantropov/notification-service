import { beforeEach, describe, expect, it, vi } from "vitest";
import winston from "winston";

import { createLogger } from "./createLogger.js";
import { type Log } from "./interfaces/index.js";
import { EVENT_TYPE, LOG_LEVEL, TRIGGER_TYPE } from "./types/index.js";

vi.mock("winston", () => {
  const mockLogger = {
    log: vi.fn(),
  };
  return {
    default: {
      createLogger: vi.fn(() => mockLogger),
      config: {
        npm: {
          levels: {
            error: 0,
            warn: 1,
            info: 2,
            http: 3,
            verbose: 4,
            debug: 5,
            silly: 6,
          },
        },
      },
    },
  };
});

vi.mock("@opentelemetry/winston-transport", () => ({
  OpenTelemetryTransportV3: vi.fn().mockImplementation(() => ({})),
}));

describe("Logger Infrastructure", () => {
  const logger = createLogger({ level: LOG_LEVEL.TRACE });
  const winstonMock = vi.mocked(winston.createLogger());

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Log Levels delegation", () => {
    const baseLog: Log = {
      message: "msg",
      eventName: "test_event",
      eventType: EVENT_TYPE.INTERNAL,
      trigger: TRIGGER_TYPE.API,
    };

    it("should delegate trace level to winston", async () => {
      await logger.trace(baseLog);
      expect(winstonMock.log).toHaveBeenCalledWith(
        LOG_LEVEL.TRACE,
        "msg",
        expect.anything(),
      );
    });

    it("should delegate debug level to winston", async () => {
      await logger.debug(baseLog);
      expect(winstonMock.log).toHaveBeenCalledWith(
        LOG_LEVEL.DEBUG,
        "msg",
        expect.anything(),
      );
    });

    it("should delegate info level to winston", async () => {
      await logger.info(baseLog);
      expect(winstonMock.log).toHaveBeenCalledWith(
        LOG_LEVEL.INFO,
        "msg",
        expect.anything(),
      );
    });

    it("should delegate warn level to winston", async () => {
      await logger.warn(baseLog);
      expect(winstonMock.log).toHaveBeenCalledWith(
        LOG_LEVEL.WARN,
        "msg",
        expect.anything(),
      );
    });

    it("should delegate error level to winston", async () => {
      await logger.error(baseLog);
      expect(winstonMock.log).toHaveBeenCalledWith(
        LOG_LEVEL.ERROR,
        "msg",
        expect.anything(),
      );
    });

    it("should delegate fatal level to winston", async () => {
      await logger.fatal(baseLog);
      expect(winstonMock.log).toHaveBeenCalledWith(
        LOG_LEVEL.FATAL,
        "msg",
        expect.anything(),
      );
    });
  });

  describe("Metadata & Snake Case Transformation", () => {
    it("should transform complex nested details and include eventName", async () => {
      const complexLog: Log = {
        message: "integration call",
        eventName: "remote_call",
        eventType: EVENT_TYPE.INTEGRATION,
        trigger: TRIGGER_TYPE.CRON,
        details: {
          externalService: "Bitrix",
          metaData: { isUrgent: true },
        },
      };

      await logger.info(complexLog);

      expect(winstonMock.log).toHaveBeenCalledWith(
        LOG_LEVEL.INFO,
        "integration call",
        expect.objectContaining({
          eventName: "remote_call",
          event_type: EVENT_TYPE.INTEGRATION,
          external_service: "Bitrix",
          meta_data: expect.objectContaining({ is_urgent: true }),
        }),
      );
    });

    it("should ensure trigger and duration_ms are correctly mapped", async () => {
      await logger.debug({
        message: "ping",
        eventName: "health_check",
        eventType: EVENT_TYPE.LIFECYCLE,
        trigger: TRIGGER_TYPE.MANUAL,
      });

      expect(winstonMock.log).toHaveBeenCalledWith(
        LOG_LEVEL.DEBUG,
        "ping",
        expect.objectContaining({
          trigger: TRIGGER_TYPE.MANUAL,
          duration_ms: 0,
        }),
      );
    });
  });

  describe("Error Handling & Serialization", () => {
    it("should serialize Error and spread snake_cased properties", async () => {
      interface ErrorWithCode extends Error {
        errorCode: string;
      }
      const dbError = new Error("Timeout") as ErrorWithCode;
      dbError.errorCode = "DB_001";

      await logger.error({
        message: "database failure",
        eventName: "db_error",
        error: dbError,
      });

      expect(winstonMock.log).toHaveBeenCalledWith(
        LOG_LEVEL.ERROR,
        "database failure",
        expect.objectContaining({
          error_code: "DB_001",
          message: "Timeout",
        }),
      );
    });
  });

  describe("Boundary Cases", () => {
    it("should contain expected keys for minimal log", async () => {
      await logger.info({
        message: "clean log",
        eventName: "test",
        eventType: EVENT_TYPE.LIFECYCLE,
        trigger: TRIGGER_TYPE.API,
      });

      expect(winstonMock.log).toHaveBeenCalledWith(
        LOG_LEVEL.INFO,
        "clean log",
        expect.toSatisfy((meta: Record<string, unknown>) => {
          const keys = Object.keys(meta);
          return (
            keys.length === 4 &&
            keys.includes("eventName") &&
            keys.includes("duration_ms")
          );
        }),
      );
    });
  });
});
