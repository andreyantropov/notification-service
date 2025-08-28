import { describe, it, expect, vi, beforeEach } from "vitest";
import { createServer } from "./createServer.js";
import { Express } from "express";
import { ServerConfig } from "./interfaces/ServerConfig.js";
import { ServerDependencies } from "./interfaces/ServerDependencies.js";
import { Counter } from "../../../../shared/interfaces/Counter.js";

describe("createServer", () => {
  let mockApp: Express;
  let mockServer: {
    close: (cb?: (err?: Error) => void) => void;
    listening: boolean;
  };
  let mockActiveRequestsCounter: Counter;
  let mockConfig: ServerConfig;
  let mockDependencies: ServerDependencies;

  beforeEach(() => {
    mockServer = {
      close: vi.fn((cb) => cb?.(undefined)),
      listening: true,
    };

    mockApp = {
      listen: vi.fn((port, cb) => {
        cb?.();
        return mockServer;
      }),
    } as unknown as Express;

    mockActiveRequestsCounter = {
      value: 0,
      increase: vi.fn(),
      decrease: vi.fn(),
    };

    mockConfig = {
      port: 3000,
      gracefulShutdownTimeout: 1000,
    };

    mockDependencies = {
      activeRequestsCounter: mockActiveRequestsCounter,
    };
  });

  describe("start", () => {
    it("should start the server on the specified port", () => {
      const server = createServer(mockApp, mockConfig, mockDependencies);
      server.start();

      expect(mockApp.listen).toHaveBeenCalledWith(
        mockConfig.port,
        expect.any(Function),
      );
    });

    it("should call onStartError when server fails to start", () => {
      const error = new Error("Failed to start");
      const onStartError = vi.fn();
      mockApp.listen = vi.fn(() => {
        throw error;
      });

      const server = createServer(
        mockApp,
        { ...mockConfig, onStartError },
        mockDependencies,
      );
      server.start();

      expect(onStartError).toHaveBeenCalledWith(
        expect.objectContaining({
          message: `Не удалось запустить сервер на порту ${mockConfig.port}`,
          cause: error,
        }),
      );
    });
  });

  describe("stop", () => {
    it("should do nothing if server is not running", async () => {
      const server = createServer(mockApp, mockConfig, mockDependencies);
      await server.stop();

      expect(mockServer.close).not.toHaveBeenCalled();
    });

    it("should close the server when no active requests", async () => {
      const server = createServer(mockApp, mockConfig, mockDependencies);
      server.start();
      await server.stop();

      expect(mockServer.close).toHaveBeenCalled();
    });

    it("should wait for active requests to complete before closing", async () => {
      let counter = 1;
      const counterWithPending: Counter = {
        get value() {
          return counter;
        },
        increase: vi.fn(() => counter++),
        decrease: vi.fn(() => counter--),
      };

      const server = createServer(mockApp, mockConfig, {
        activeRequestsCounter: counterWithPending,
      });
      server.start();

      const stopPromise = server.stop();

      setTimeout(() => {
        counterWithPending.decrease();
      }, 50);

      await stopPromise;

      expect(mockServer.close).toHaveBeenCalled();
    });

    it("should reject with timeout error if graceful shutdown exceeds timeout", async () => {
      const onStopError = vi.fn();
      mockActiveRequestsCounter = {
        value: 1,
        increase: vi.fn(),
        decrease: vi.fn(),
      };

      const server = createServer(
        mockApp,
        { ...mockConfig, gracefulShutdownTimeout: 50, onStopError },
        { activeRequestsCounter: mockActiveRequestsCounter },
      );
      server.start();

      await expect(server.stop()).rejects.toThrow(
        "Shutdown timeout after 50ms",
      );
      expect(onStopError).toHaveBeenCalled();
    });

    it("should call onStopError when server fails to close", async () => {
      const error = new Error("Failed to close");
      const onStopError = vi.fn();
      mockServer.close = vi.fn((cb) => cb?.(error));

      const server = createServer(
        mockApp,
        { ...mockConfig, onStopError },
        mockDependencies,
      );
      server.start();

      await expect(server.stop()).rejects.toThrow(error);
      expect(onStopError).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Не удалось корректно завершить работу сервера",
          cause: error,
        }),
      );
    });
  });
});
