import { AMQPClient, AMQPMessage, AMQPChannel } from "@cloudamqp/amqp-client";
import pTimeout from "p-timeout";

import {
  DEFAULT_MAX_BATCH_SIZE,
  DEFAULT_BATCH_FLUSH_TIMEOUT_MS,
  DEFAULT_FLUSH_TIMEOUT_MS,
  DEFAULT_HEALTHCHECK_TIMEOUT_MS,
  CHECK_SHUTDOWN_TIMEOUT_MS,
} from "./constants/index.js";
import type {
  BatchConsumerDependencies,
  BatchConsumerConfig,
  HandlerResult,
  BatchItem,
} from "./interfaces/index.js";
import type { Consumer } from "../../../../application/ports/index.js";
import { noop } from "../../../../shared/utils/index.js";
import type { AMQPConnection } from "../../types/index.js";

export const createBatchConsumer = <T>(
  dependencies: BatchConsumerDependencies<T>,
  config: BatchConsumerConfig,
): Consumer => {
  const { handler } = dependencies;
  const {
    url,
    queue,
    maxBatchSize = DEFAULT_MAX_BATCH_SIZE,
    batchFlushTimeoutMs = DEFAULT_BATCH_FLUSH_TIMEOUT_MS,
    nackOptions = { requeue: false, multiple: false },
    flushTimeoutMs = DEFAULT_FLUSH_TIMEOUT_MS,
    healthcheckTimeoutMs = DEFAULT_HEALTHCHECK_TIMEOUT_MS,
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

  const batch: BatchItem<T>[] = [];

  const processBatch = async (
    currentBatch: readonly BatchItem<T>[],
  ): Promise<void> => {
    let results: HandlerResult[] = [];
    try {
      results = await handler(currentBatch.map((batchItem) => batchItem.item));
      if (results.length !== currentBatch.length) {
        throw new Error("Handler вернул некорректное количество результатов");
      }
    } catch {
      results = currentBatch.map(() => ({ status: "failure" }));
    }

    for (let i = 0; i < currentBatch.length; i++) {
      const { msg } = currentBatch[i];
      const { status } = results[i];

      if (status === "success") {
        await msg.ack();
      } else {
        await msg.nack(nackOptions.requeue, nackOptions.multiple);
      }
    }
  };

  const flush = async (): Promise<void> => {
    if (isFlushing || batch.length === 0 || !ch) {
      return;
    }

    isFlushing = true;
    const currentBatch = [...batch];
    batch.length = 0;

    try {
      await pTimeout(
        processBatch(currentBatch),
        {
          milliseconds: flushTimeoutMs,
          message: "Таймаут при обработке и подтверждении батча сообщений",
        },
      );
    } catch (error) {
      onError(error);
      try {
        for (const { msg } of currentBatch) {
          await msg.nack(nackOptions.requeue, nackOptions.multiple);
        }
      } catch (nackError) {
        onError(nackError);
      }
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
        item = JSON.parse(bodyStr);
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
      }, batchFlushTimeoutMs);

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
          setTimeout(resolve, CHECK_SHUTDOWN_TIMEOUT_MS),
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
        milliseconds: healthcheckTimeoutMs,
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
