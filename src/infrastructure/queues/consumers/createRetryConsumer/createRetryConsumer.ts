import {
  AMQPClient,
  AMQPMessage,
  AMQPChannel,
  Field,
} from "@cloudamqp/amqp-client";
import pTimeout from "p-timeout";

import { RetryConsumerConfig } from "./interfaces/index.js";
import { RetryConsumerDependencies } from "./interfaces/RetryConsumerDependencies.js";
import { Consumer } from "../../../../application/ports/index.js";
import { noop } from "../../../../shared/utils/index.js";
import { AMQPConnection } from "../../types/index.js";

const PERSISTENT = 2;
const CHECK_SHUTDOWN_TIMEOUT_MS = 100;
const DEFAULT_RETRY_PUBLISH_TIMEOUT_MS = 10_000;
const DEFAULT_HEALTHCHECK_TIMEOUT_MS = 5_000;

export const createRetryConsumer = (
  dependencies: RetryConsumerDependencies,
  config: RetryConsumerConfig,
): Consumer => {
  const { handler } = dependencies;
  const {
    url,
    queue,
    nackOptions = { requeue: false, multiple: false },
    retryPublishTimeoutMs = DEFAULT_RETRY_PUBLISH_TIMEOUT_MS,
    healthcheckTimeoutMs = DEFAULT_HEALTHCHECK_TIMEOUT_MS,
    onError = noop,
  } = config;

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

    await pTimeout(
      ch.basicPublish("", targetQueue, body, {
        headers,
        deliveryMode: PERSISTENT,
      }),
      {
        milliseconds: retryPublishTimeoutMs,
        message: `Таймаут при публикации сообщения в очередь "${targetQueue}" из retry consumer'а`,
      },
    );
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

      let currentRetryCount: number;
      if (isRetryCountValid(rawRetryCount)) {
        currentRetryCount = Number(rawRetryCount);
      } else {
        currentRetryCount = 0;
      }

      const nextRetryCount = currentRetryCount + 1;

      const newHeaders: Record<string, Field> = {
        ...rawHeaders,
        "x-retry-count": nextRetryCount,
      };

      const targetQueue = handler(nextRetryCount);

      await publishToQueue(targetQueue, msg.body, newHeaders);
      await msg.ack();
    } catch (error) {
      onError(error);
      await msg.nack(nackOptions.requeue, nackOptions.multiple);
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
        setTimeout(resolve, CHECK_SHUTDOWN_TIMEOUT_MS),
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
        milliseconds: healthcheckTimeoutMs,
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
