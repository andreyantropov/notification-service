import { Express } from "express";
import { describe, it, expect, vi, beforeEach } from "vitest";

import { createServer } from "./createServer.js";
import { ServerConfig, ServerDependencies } from "./interfaces/index.js";

type MockServer = {
  close: (cb?: (error?: Error) => void) => void;
  on: (event: string, listener: (...args: unknown[]) => void) => void;
};

describe("createServer", () => {
  let mockApp: Express;
  let mockServer: MockServer;
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
        if (cb) {
          setImmediate(cb);
        }
        return mockServer;
      }),
    } as unknown as Express;

    mockConfig = {
      port: 3000,
    };

    mockDependencies = {
      app: mockApp,
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

    it("should not start multiple times if already starting", async () => {
      let listenCallback: (() => void) | undefined;
      const delayedApp = {
        listen: vi.fn((port: number, cb?: () => void) => {
          listenCallback = cb;
          return mockServer;
        }),
      } as unknown as Express;

      const server = createServer(
        { ...mockDependencies, app: delayedApp },
        mockConfig,
      );

      const firstStart = server.start();
      await new Promise(setImmediate);

      await server.start();

      listenCallback?.();
      await firstStart;

      expect(delayedApp.listen).toHaveBeenCalledTimes(1);
    });

    it("should not start multiple times if already running", async () => {
      const server = createServer(mockDependencies, mockConfig);

      await server.start();
      await server.start();

      expect(mockApp.listen).toHaveBeenCalledTimes(1);
    });
  });

  describe("shutdown", () => {
    it("should do nothing if server is not running", async () => {
      const server = createServer(mockDependencies, mockConfig);
      await server.shutdown();

      expect(mockServer.close).not.toHaveBeenCalled();
    });

    it("should close the server when no active requests", async () => {
      const server = createServer(mockDependencies, mockConfig);
      await server.start();
      await server.shutdown();

      expect(mockServer.close).toHaveBeenCalled();
    });

    it("should not shut down multiple times if already stopping", async () => {
      const server = createServer(mockDependencies, mockConfig);
      await server.start();

      const shutdown1 = server.shutdown();
      await server.shutdown();

      expect(mockServer.close).toHaveBeenCalledTimes(1);
      await shutdown1;
    });

    it("should not shut down if start is in progress", async () => {
      let listenCallback: (() => void) | undefined;
      const delayedApp = {
        listen: vi.fn((port: number, cb?: () => void) => {
          listenCallback = cb;
          return mockServer;
        }),
      } as unknown as Express;

      const server = createServer(
        { ...mockDependencies, app: delayedApp },
        mockConfig,
      );

      const startPromise = server.start();
      await new Promise(setImmediate);
      await server.shutdown();

      expect(mockServer.close).not.toHaveBeenCalled();

      listenCallback?.();
      await startPromise;
    });
  });

  it("should reject if server emits an 'error' event during startup", async () => {
    const originalError = new Error("EADDRINUSE");

    const errorMockServer: MockServer = {
      close: vi.fn(),
      on: vi.fn(),
    };

    const errorEmittingApp = {
      listen: vi.fn(() => {
        setImmediate(() => {
          const errorListener = (
            errorMockServer.on as ReturnType<typeof vi.fn>
          ).mock.calls
            .find(([event]) => event === "error")
            ?.at(1);

          if (typeof errorListener === "function") {
            errorListener(originalError);
          }
        });

        return errorMockServer;
      }),
    } as unknown as Express;

    const server = createServer(
      { ...mockDependencies, app: errorEmittingApp },
      mockConfig,
    );

    await expect(server.start()).rejects.toBe(originalError);
  });
});
