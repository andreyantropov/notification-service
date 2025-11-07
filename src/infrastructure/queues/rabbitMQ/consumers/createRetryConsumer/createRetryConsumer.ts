import {
  AMQPClient,
  AMQPMessage,
  AMQPChannel,
  Field,
} from "@cloudamqp/amqp-client";
import pTimeout from "p-timeout";

import { RetryConsumerConfig } from "./interfaces/RetryConsumerConfig.js";
import { Consumer } from "../../../../../application/ports/Consumer.js";
import { noop } from "../../../../../shared/utils/noop/noop.js";
import { AMQPConnection } from "../types/AMQPConnection.js";

const DEFAULT_HEALTHCHECK_TIMEOUT = 5000;
const PERSISTENT = 2;
const CHECK_SHUTDOWN_TIMEOUT = 100;

export const createRetryConsumer = (config: RetryConsumerConfig): Consumer => {
  const { url, queue, onError = noop } = config;

  const client = new AMQPClient(url);

  let conn: AMQPConnection | null = null;
  let ch: AMQPChannel | null = null;
  let abortController: AbortController | null = null;
  let isStarting = false;
  let isShuttingDown = false;

  const publishToQueue = async (
    targetQueue: string,
    body: Uint8Array | null,
    headers: Record<string, Field>,
  ): Promise<void> => {
    if (!ch) {
      throw new Error("Канал недоступен");
    }
    await ch.basicPublish("", targetQueue, body, {
      headers,
      deliveryMode: PERSISTENT,
    });
  };

  const isRetryCountValid = (retryCount: Field): boolean => {
    if (retryCount == null) return false;

    if (typeof retryCount !== "number" && typeof retryCount !== "string") {
      return false;
    }
    if (typeof retryCount === "string") {
      if (!/^[0-9]+$/.test(retryCount)) {
        return false;
      }
    }

    const num = Number(retryCount);
    return Number.isInteger(num) && num >= 0;
  };

  const handleMessage = async (
    msg: AMQPMessage,
    abortSignal: AbortSignal,
  ): Promise<void> => {
    try {
      if (abortSignal.aborted || isShuttingDown) {
        return;
      }

      if (msg.body === null) {
        await msg.ack();
        return;
      }

      const rawHeaders = msg.properties?.headers ?? {};
      const rawRetryCount = rawHeaders["x-retry-count"];
      const isRawRetryCountValid = isRetryCountValid(rawRetryCount);

      if (!isRawRetryCountValid) {
        await publishToQueue("dlq", msg.body, { ...rawHeaders });
        await msg.ack();
        return;
      }

      const currentRetryCount = Number(rawRetryCount);
      const nextRetryCount = currentRetryCount + 1;

      const newHeaders: Record<string, Field> = {
        ...rawHeaders,
        "x-retry-count": nextRetryCount,
      };

      let targetQueue: string;

      if (nextRetryCount === 1) {
        targetQueue = "retry-1";
      } else if (nextRetryCount === 2) {
        targetQueue = "retry-2";
      } else {
        targetQueue = "dlq";
      }

      await publishToQueue(targetQueue, msg.body, newHeaders);
      await msg.ack();
    } catch (error) {
      onError(error);
      try {
        const originalRetryCount = msg.properties?.headers?.["x-retry-count"];
        const fallbackHeaders: Record<string, Field> = {
          "x-retry-consumer-failure": true,
          "x-original-retry-count":
            originalRetryCount != null && !isNaN(Number(originalRetryCount))
              ? Number(originalRetryCount)
              : 0,
        };
        await publishToQueue("dlq", msg.body, fallbackHeaders);
        await msg.ack();
      } catch (dlqError) {
        onError(dlqError);
        await msg.nack(false, false);
      }
    }
  };

  const start = async (): Promise<void> => {
    if (isStarting || isShuttingDown || ch) {
      return;
    }

    isStarting = true;
    try {
      const ac = new AbortController();
      abortController = ac;

      conn = await client.connect();
      ch = await conn.channel();

      await ch.queueDeclare(queue, { durable: true });
      await ch.basicConsume(queue, { noAck: false }, (msg) => {
        if (!ac.signal.aborted) {
          handleMessage(msg, ac.signal).catch(onError);
        }
      });
    } finally {
      isStarting = false;
    }
  };

  const shutdown = async (): Promise<void> => {
    if (isStarting || isShuttingDown || !ch) {
      return;
    }

    isShuttingDown = true;
    try {
      if (abortController) {
        abortController.abort();
        abortController = null;
      }

      await new Promise((resolve) =>
        setTimeout(resolve, CHECK_SHUTDOWN_TIMEOUT),
      );

      if (ch) {
        await ch.close();
        ch = null;
      }
      if (conn) {
        await conn.close();
        conn = null;
      }
    } finally {
      isShuttingDown = false;
    }
  };

  const checkHealth = async (): Promise<void> => {
    let tempConn: AMQPConnection | null = null;
    try {
      const tempClient = new AMQPClient(url);
      tempConn = await pTimeout(tempClient.connect(), {
        milliseconds: DEFAULT_HEALTHCHECK_TIMEOUT,
        message: "Превышено время ожидания подключения к RabbitMQ",
      });
    } catch (error) {
      throw new Error(`RabbitMQ недоступен`, { cause: error });
    } finally {
      if (tempConn) await tempConn.close();
    }
  };

  return {
    start,
    shutdown,
    checkHealth,
  };
};
