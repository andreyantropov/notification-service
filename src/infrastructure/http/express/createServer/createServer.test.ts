import { Express } from "express";
import { describe, it, expect, vi, beforeEach, Mock } from "vitest";

import { createServer } from "./createServer.js";
import { ServerConfig } from "./interfaces/ServerConfig.js";
import { ServerDependencies } from "./interfaces/ServerDependencies.js";
import { Counter } from "../../../ports/Counter.js";

type MockServer = {
  close: (cb?: (error?: Error) => void) => void;
  on: (event: string, listener: (...args: unknown[]) => void) => void;
};

describe("createServer", () => {
  let mockApp: Express;
  let mockServer: MockServer;
  let mockActiveRequestsCounter: Counter;
  let mockConfig: ServerConfig;
  let mockDependencies: ServerDependencies;

  beforeEach(() => {
    const onMock = vi.fn();

    mockServer = {
      close: vi.fn((cb) => cb?.(undefined)),
      on: onMock,
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
      app: mockApp,
      activeRequestsCounter: mockActiveRequestsCounter,
    };
  });

  describe("start", () => {
    it("should start the server on the specified port", async () => {
      const server = createServer(mockDependencies, mockConfig);
      await server.start();

      expect(mockApp.listen).toHaveBeenCalledWith(
        mockConfig.port,
        expect.any(Function),
      );
    });

    it("should call onStart when server starts successfully", async () => {
      const onStart = vi.fn();
      const server = createServer(mockDependencies, {
        ...mockConfig,
        onStart,
      });
      await server.start();

      expect(onStart).toHaveBeenCalled();
    });

    it("should call onStartError and reject when server emits an 'error' event during startup", async () => {
      const onStartError = vi.fn();
      const error = new Error("EADDRINUSE");

      const mockAppWithError = {
        listen: vi.fn(() => {
          return mockServer;
        }),
      } as unknown as Express;

      const server = createServer(
        {
          ...mockDependencies,
          app: mockAppWithError,
        },
        {
          ...mockConfig,
          onStartError,
        },
      );

      const startPromise = server.start();

      const errorListener = (mockServer.on as Mock).mock.calls.find(
        (call) => call[0] === "error",
      )?.[1];
      if (errorListener) {
        errorListener(error);
      }

      await expect(startPromise).rejects.toThrow(
        `Не удалось запустить сервер на порту ${mockConfig.port}`,
      );

      expect(onStartError).toHaveBeenCalledWith(
        expect.objectContaining({
          message: `Не удалось запустить сервер на порту ${mockConfig.port}`,
          cause: error,
        }),
      );
    });

    it("should call onRuntimeError when server emits an 'error' after successful start", async () => {
      const onRuntimeError = vi.fn();
      const error = new Error("Socket error during operation");

      const server = createServer(mockDependencies, {
        ...mockConfig,
        onRuntimeError,
      });

      await server.start();

      const errorListener = (mockServer.on as Mock).mock.calls.find(
        (call) => call[0] === "error",
      )?.[1];
      if (errorListener) {
        errorListener(error);
      }

      expect(onRuntimeError).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Критическая ошибка сервера во время работы",
          cause: error,
        }),
      );
    });

    it("should not start if already starting", async () => {
      const onStartWarning = vi.fn();

      let listenCallback: (() => void) | undefined;
      const delayedApp = {
        listen: vi.fn((port: number, cb?: () => void) => {
          listenCallback = cb;
          return mockServer;
        }),
      } as unknown as Express;

      const server = createServer(
        { ...mockDependencies, app: delayedApp },
        { ...mockConfig, onStartWarning },
      );

      const firstStart = server.start();

      await new Promise(setImmediate);

      await server.start();

      listenCallback?.();
      await firstStart;

      expect(onStartWarning).toHaveBeenCalledWith("Сервер уже запускается");
      expect(delayedApp.listen).toHaveBeenCalledTimes(1);
    });

    it("should not start if already running", async () => {
      const onStartWarning = vi.fn();
      const server = createServer(mockDependencies, {
        ...mockConfig,
        onStartWarning,
      });

      await server.start();
      await server.start();

      expect(onStartWarning).toHaveBeenCalledWith("Сервер уже запущен");
      expect(mockApp.listen).toHaveBeenCalledTimes(1);
    });

    it("should not start if stopping", async () => {
      const onStartWarning = vi.fn();
      const server = createServer(mockDependencies, {
        ...mockConfig,
        onStartWarning,
      });

      await server.start();
      const shutdownPromise = server.shutdown();
      await server.start();

      expect(onStartWarning).toHaveBeenCalledWith(
        "Нельзя запустить сервер во время остановки",
      );
      await shutdownPromise;
    });
  });

  describe("shutdown", () => {
    it("should do nothing if server is not running", async () => {
      const onShutdownWarning = vi.fn();
      const server = createServer(mockDependencies, {
        ...mockConfig,
        onShutdownWarning,
      });
      await server.shutdown();

      expect(onShutdownWarning).toHaveBeenCalledWith("Сервер уже остановлен");
      expect(mockServer.close).not.toHaveBeenCalled();
    });

    it("should close the server when no active requests", async () => {
      const onShutdown = vi.fn();
      const server = createServer(mockDependencies, {
        ...mockConfig,
        onShutdown,
      });
      await server.start();
      await server.shutdown();

      expect(mockServer.close).toHaveBeenCalled();
      expect(onShutdown).toHaveBeenCalled();
    });

    it("should wait for active requests to complete before closing", async () => {
      let counterValue = 1;
      const counterWithPending: Counter = {
        get value() {
          return counterValue;
        },
        increase: vi.fn(() => counterValue++),
        decrease: vi.fn(() => counterValue--),
      };

      const server = createServer(
        {
          app: mockApp,
          activeRequestsCounter: counterWithPending,
        },
        mockConfig,
      );
      await server.start();

      const shutdownPromise = server.shutdown();

      setTimeout(() => {
        counterValue = 0;
      }, 50);

      await shutdownPromise;

      expect(mockServer.close).toHaveBeenCalled();
    });

    it("should trigger onShutdownError on timeout during graceful shutdown", async () => {
      const onShutdownError = vi.fn();
      const slowCounter: Counter = {
        value: 1,
        increase: vi.fn(),
        decrease: vi.fn(),
      };

      const server = createServer(
        { app: mockApp, activeRequestsCounter: slowCounter },
        { ...mockConfig, gracefulShutdownTimeout: 50, onShutdownError },
      );
      await server.start();

      try {
        await server.shutdown();
      } catch {
        /* empty */
      }

      expect(onShutdownError).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Не удалось корректно завершить работу сервера",
          cause: expect.objectContaining({
            message: "Shutdown timeout after 50ms",
          }),
        }),
      );
    });

    it("should call onShutdownError when server.close reports an error", async () => {
      const error = new Error("Close failed");
      mockServer.close = vi.fn((cb) => cb?.(error));

      const onShutdownError = vi.fn();
      const server = createServer(mockDependencies, {
        ...mockConfig,
        onShutdownError,
      });
      await server.start();

      try {
        await server.shutdown();
      } catch {
        /* empty */
      }

      expect(onShutdownError).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Не удалось корректно завершить работу сервера",
          cause: error,
        }),
      );
    });

    it("should not shut down if already stopping", async () => {
      const onShutdownWarning = vi.fn();
      const server = createServer(mockDependencies, {
        ...mockConfig,
        onShutdownWarning,
      });
      await server.start();

      const shutdown1 = server.shutdown();
      await server.shutdown();

      expect(onShutdownWarning).toHaveBeenCalledWith(
        "Сервер уже останавливается",
      );
      expect(mockServer.close).toHaveBeenCalledTimes(1);

      await shutdown1;
    });

    it("should not shut down if starting", async () => {
      const onShutdownWarning = vi.fn();

      let listenCallback: (() => void) | undefined;
      const delayedApp = {
        listen: vi.fn((port: number, cb?: () => void) => {
          listenCallback = cb;
          return mockServer;
        }),
      } as unknown as Express;

      const server = createServer(
        { ...mockDependencies, app: delayedApp },
        { ...mockConfig, onShutdownWarning },
      );

      const startPromise = server.start();

      await new Promise(setImmediate);

      await server.shutdown();

      expect(onShutdownWarning).toHaveBeenCalledWith(
        "Нельзя остановить сервер во время запуска",
      );

      listenCallback?.();
      await startPromise;
    });
  });
});
