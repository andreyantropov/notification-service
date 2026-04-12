import {
  type NextFunction,
  type Request,
  type RequestHandler,
  type Response,
} from "express";

import { SPAN_KIND } from "../../../telemetry/index.js";

import { type TracerMiddlewareDependencies } from "./interfaces/index.js";

export const createTracerMiddleware = (
  dependencies: TracerMiddlewareDependencies,
): RequestHandler => {
  const { tracer } = dependencies;

  const extractTraceHeaders = (
    headers: Record<string, unknown>,
  ): Record<string, string> => {
    const traceHeaders: Record<string, string> = {};

    if (typeof headers.traceparent === "string") {
      traceHeaders.traceparent = headers.traceparent;
    }
    if (typeof headers.tracestate === "string") {
      traceHeaders.tracestate = headers.tracestate;
    }

    return traceHeaders;
  };

  return async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    const traceHeaders = extractTraceHeaders(req.headers);
    const spanName = `${req.method} ${req.route?.path || req.path}`;

    await tracer.continueTrace(traceHeaders, async () => {
      return await tracer.startActiveSpan(
        spanName,
        async () => {
          await new Promise<void>((resolve, reject) => {
            next((error: unknown) => {
              if (error) {
                reject(error);
              } else {
                resolve();
              }
            });
          });
        },
        {
          kind: SPAN_KIND.SERVER,
          attributes: {
            "http.method": req.method,
            "http.url": req.originalUrl,
            "http.scheme": req.protocol,
            ...(req.host ? { "http.host": req.host } : {}),
            ...(req.ip ? { "net.peer.ip": req.ip } : {}),
            ...(req.get("user-agent")
              ? { "http.user_agent": req.get("user-agent") }
              : {}),
            ...(req.route?.path ? { "http.route": req.route.path } : {}),
          },
        },
      );
    });
  };
};
