import { type Server as HttpServer } from "http";

import express, {
  type ErrorRequestHandler,
  type RequestHandler,
  type Router,
} from "express";
import { beforeEach, describe, expect, it, type Mock, vi } from "vitest";

import { createServer } from "./createServer.js";
import {
  type ServerConfig,
  type ServerDependencies,
} from "./interfaces/index.js";

interface MockApp {
  use: Mock<express.Application["use"]>;
  listen: Mock<express.Application["listen"]>;
}

vi.mock("express", () => {
  const app = {
    use: vi.fn(),
    listen: vi.fn(),
  };
  return {
    default: vi.fn(() => app),
  };
});

describe("createServer", () => {
  const mockPort = 3000;
  const mockConfig: ServerConfig = { port: mockPort };

  const mockDependencies: ServerDependencies = {
    preHandlers: [vi.fn() as unknown as RequestHandler],
    postHandlers: [vi.fn() as unknown as ErrorRequestHandler],
    router: vi.fn() as unknown as Router,
  };

  const mockApp = express() as unknown as MockApp;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should initialize express app with provided handlers and routes", () => {
    createServer(mockDependencies, mockConfig);

    expect(mockApp.use).toHaveBeenCalledWith(
      ...mockDependencies.preHandlers,
      mockDependencies.router,
      ...mockDependencies.postHandlers,
    );
  });

  it("should start the server successfully", async () => {
    const mockHttpServer = {
      on: vi.fn(),
      once: vi.fn().mockReturnThis(),
      close: vi.fn(),
    } as unknown as HttpServer;

    mockApp.listen.mockImplementation(((
      port: number,
      callback?: () => void,
    ) => {
      callback?.();
      return mockHttpServer;
    }) as unknown as MockApp["listen"]);

    const { start } = createServer(mockDependencies, mockConfig);
    await expect(start()).resolves.toBeUndefined();
    expect(mockApp.listen).toHaveBeenCalledWith(mockPort, expect.any(Function));
  });

  it("should fail to start if the server emits an error event", async () => {
    const mockHttpServer = {
      on: vi.fn((event: string, callback: () => void) => {
        if (event === "error") callback();
        return mockHttpServer;
      }),
      once: vi.fn().mockReturnThis(),
    } as unknown as HttpServer;

    mockApp.listen.mockReturnValue(
      mockHttpServer as ReturnType<MockApp["listen"]>,
    );

    const { start } = createServer(mockDependencies, mockConfig);
    await expect(start()).rejects.toBeUndefined();
  });

  it("should shutdown the server successfully when active", async () => {
    const mockHttpServer = {
      on: vi.fn(),
      close: vi.fn((callback?: (err?: Error) => void) => {
        callback?.();
        return mockHttpServer;
      }),
      once: vi.fn().mockReturnThis(),
    } as unknown as HttpServer;

    mockApp.listen.mockImplementation(((_p: number, cb?: () => void) => {
      cb?.();
      return mockHttpServer;
    }) as unknown as MockApp["listen"]);

    const { start, shutdown } = createServer(mockDependencies, mockConfig);

    await start();
    await expect(shutdown()).resolves.toBeUndefined();
    expect(mockHttpServer.close).toHaveBeenCalled();
  });

  it("should not allow multiple start attempts while starting", async () => {
    let resolveListen: (() => void) | undefined;

    mockApp.listen.mockImplementation(((_p: number, cb?: () => void) => {
      resolveListen = cb;
      return {
        on: vi.fn(),
        once: vi.fn().mockReturnThis(),
        close: vi.fn(),
      } as unknown as HttpServer;
    }) as unknown as MockApp["listen"]);

    const { start } = createServer(mockDependencies, mockConfig);

    const firstStart = start();
    const secondStart = start();

    resolveListen?.();
    await firstStart;
    await secondStart;

    expect(mockApp.listen).toHaveBeenCalledTimes(1);
  });

  it("should skip shutdown if server is not initialized", async () => {
    const { shutdown } = createServer(mockDependencies, mockConfig);
    await expect(shutdown()).resolves.toBeUndefined();
    expect(mockApp.listen).not.toHaveBeenCalled();
  });
});
