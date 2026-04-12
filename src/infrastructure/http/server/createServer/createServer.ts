import { type Server as HttpServer } from "http";

import express from "express";

import {
  type Server,
  type ServerConfig,
  type ServerDependencies,
} from "./interfaces/index.js";

export const createServer = (
  dependencies: ServerDependencies,
  config: ServerConfig,
): Server => {
  const { preHandlers, postHandlers, router } = dependencies;
  const { port } = config;

  const app = express();

  app.use(...preHandlers, router, ...postHandlers);

  let server: HttpServer | null = null;
  let isStarting = false;
  let isShuttingDown = false;

  const start = async (): Promise<void> => {
    if (isStarting || isShuttingDown || server) {
      return;
    }

    isStarting = true;
    try {
      await new Promise<void>((resolve, reject) => {
        server = app.listen(port, () => resolve());
        server.once("listening", () => resolve());
        server.on("error", () => {
          server = null;
          reject();
        });
      });
    } finally {
      isStarting = false;
    }
  };

  const shutdown = async (): Promise<void> => {
    if (isStarting || isShuttingDown || !server) {
      return;
    }

    isShuttingDown = true;
    try {
      await new Promise<void>((resolve, reject) => {
        server?.close((error) => (error ? reject(error) : resolve()));
      });
      server = null;
    } finally {
      isShuttingDown = false;
    }
  };

  return { start, shutdown };
};
