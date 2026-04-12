import { EventEmitter } from "events";

import { type NextFunction, type Request, type Response } from "express";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { type Meter } from "../../../telemetry/index.js";

import { ABORTED_STATUS_CODE } from "./constants/index.js";
import { createMeterMiddleware } from "./createMeterMiddleware.js";
import { type MeterMiddlewareDependencies } from "./interfaces/index.js";

type MockResponse = Response &
  EventEmitter & {
    headersSent: boolean;
  };

describe("createMeterMiddleware", () => {
  let mockMeter: Meter;
  let mockReq: Partial<Request>;
  let mockRes: MockResponse;
  let next: NextFunction;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();

    mockMeter = {
      add: vi.fn(),
      gauge: vi.fn(),
      increment: vi.fn(),
      record: vi.fn(),
    };

    mockReq = {};

    const resEmitter = new EventEmitter();
    mockRes = Object.assign(resEmitter, {
      statusCode: 200,
      headersSent: false,
    }) as unknown as MockResponse;

    next = vi.fn();
  });

  it("should call next() immediately", () => {
    const dependencies: MeterMiddlewareDependencies = { meter: mockMeter };
    const middleware = createMeterMiddleware(dependencies);

    middleware(mockReq as Request, mockRes as Response, next);

    expect(next).toHaveBeenCalledTimes(1);
  });

  it("should record metrics with correct status code on finish", () => {
    const dependencies: MeterMiddlewareDependencies = { meter: mockMeter };
    const middleware = createMeterMiddleware(dependencies);
    mockRes.statusCode = 201;

    middleware(mockReq as Request, mockRes as Response, next);

    vi.advanceTimersByTime(250);
    mockRes.emit("finish");

    expect(mockMeter.increment).toHaveBeenCalledWith("http_requests_total", {
      statusCode: 201,
    });

    expect(mockMeter.record).toHaveBeenCalledWith(
      "http_requests_duration_ms",
      250,
      { statusCode: 201 },
    );
  });

  it("should record aborted metrics on 'close' if headers were not sent", () => {
    const dependencies: MeterMiddlewareDependencies = { meter: mockMeter };
    const middleware = createMeterMiddleware(dependencies);
    mockRes.headersSent = false;

    middleware(mockReq as Request, mockRes as Response, next);

    vi.advanceTimersByTime(100);
    mockRes.emit("close");

    expect(mockMeter.increment).toHaveBeenCalledWith("http_requests_total", {
      statusCode: ABORTED_STATUS_CODE,
    });

    expect(mockMeter.record).toHaveBeenCalledWith(
      "http_requests_duration_ms",
      100,
      { statusCode: ABORTED_STATUS_CODE },
    );
  });

  it("should not record metrics on 'close' if headers were already sent", () => {
    const dependencies: MeterMiddlewareDependencies = { meter: mockMeter };
    const middleware = createMeterMiddleware(dependencies);
    mockRes.headersSent = true;

    middleware(mockReq as Request, mockRes as Response, next);
    mockRes.emit("close");

    expect(mockMeter.increment).not.toHaveBeenCalled();
    expect(mockMeter.record).not.toHaveBeenCalled();
  });
});
