import { AMQPClient, AMQPMessage, AMQPChannel } from "@cloudamqp/amqp-client";
import pTimeout from "p-timeout";

import { BatchConsumerConfig } from "./interfaces/BatchConsumerConfig.js";
import { BatchConsumerDependencies } from "./interfaces/BatchConsumerDependencies.js";
import { Consumer } from "../../../../../application/ports/Consumer.js";
import { noop } from "../../../../../shared/utils/noop/noop.js";
import { AMQPConnection } from "../types/AMQPConnection.js";

const DEFAULT_MAX_BATCH_SIZE = 1000;
const DEFAULT_BATCH_FLUSH_TIMEOUT_MS = 60_000;
const CHECK_SHUTDOWN_TIMEOUT = 100;
const DEFAULT_HEALTHCHECK_TIMEOUT = 5000;

export const createBatchConsumer = <T>(
  dependencies: BatchConsumerDependencies<T>,
  config: BatchConsumerConfig,
): Consumer => {
  const { handler } = dependencies;
  const {
    url,
    queue,
    maxBatchSize = DEFAULT_MAX_BATCH_SIZE,
    batchSizeFlushTimeoutMs = DEFAULT_BATCH_FLUSH_TIMEOUT_MS,
    nackOptions = { requeue: false, multiple: false },
    onError = noop,
  } = config;

  const client = new AMQPClient(url);

  let conn: AMQPConnection | null = null;
  let ch: AMQPChannel | null = null;
  let abortController: AbortController | null = null;
  let flushInterval: NodeJS.Timeout | null = null;
  let isFlushing = false;
  let isStarting = false;
  let isShuttingDown = false;

  const batch: Array<{ item: T; msg: AMQPMessage }> = [];

  const flush = async (): Promise<void> => {
    if (isFlushing || batch.length === 0 || !ch) {
      return;
    }

    isFlushing = true;
    const currentBatch = [...batch];
    batch.length = 0;

    let results: Array<{ success: boolean }>;

    try {
      results = await handler(currentBatch.map((b) => b.item));
      if (results.length !== currentBatch.length) {
        results = currentBatch.map(() => ({ success: false }));
      }
    } catch {
      results = currentBatch.map(() => ({ success: false }));
    }

    try {
      for (let i = 0; i < currentBatch.length; i++) {
        const { msg } = currentBatch[i];
        const { success } = results[i];

        if (success) {
          await msg.ack();
        } else {
          await msg.nack(nackOptions.requeue, nackOptions.multiple);
        }
      }
    } catch (error) {
      onError(error);
    } finally {
      isFlushing = false;
    }
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

      let item: T;
      try {
        const bodyStr = Buffer.from(msg.body).toString();
        item = JSON.parse(bodyStr) as T;
      } catch {
        await msg.nack(nackOptions.requeue, nackOptions.multiple);
        return;
      }

      batch.push({ item, msg });

      if (batch.length >= maxBatchSize) {
        await flush();
      }
    } catch (error) {
      onError(error);
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

      await ch.basicQos(maxBatchSize);
      await ch.queueDeclare(queue, { durable: true });

      flushInterval = setInterval(async () => {
        if (!ac.signal.aborted && batch.length > 0) {
          await flush();
        }
      }, batchSizeFlushTimeoutMs);

      await ch.basicConsume(queue, { noAck: false }, (msg: AMQPMessage) => {
        handleMessage(msg, ac.signal);
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

      if (flushInterval) {
        clearInterval(flushInterval);
        flushInterval = null;
      }

      while (isFlushing) {
        await new Promise((resolve) =>
          setTimeout(resolve, CHECK_SHUTDOWN_TIMEOUT),
        );
      }

      if (batch.length > 0) {
        await flush();
      }

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
      if (tempConn) {
        await tempConn.close();
      }
    }
  };

  return { start, shutdown, checkHealth };
};
