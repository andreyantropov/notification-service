import { AMQPClient, AMQPChannel } from "@cloudamqp/amqp-client";
import type { AMQPBaseClient } from "@cloudamqp/amqp-client/amqp-base-client";
import pTimeout from "p-timeout";

import {
  DEFAULT_PUBLISH_TIMEOUT_MS,
  DEFAULT_HEALTHCHECK_TIMEOUT_MS,
  PERSISTENT,
} from "./constants/index.js";
import type { ProducerConfig } from "./interfaces/index.js";
import type { Producer } from "../../../../application/ports/index.js";

export const createProducer = <T>(config: ProducerConfig): Producer<T> => {
  const {
    url,
    queue,
    publishTimeoutMs = DEFAULT_PUBLISH_TIMEOUT_MS,
    healthcheckTimeoutMs = DEFAULT_HEALTHCHECK_TIMEOUT_MS,
  } = config;
  const client = new AMQPClient(url);

  let conn: AMQPBaseClient | null = null;
  let ch: AMQPChannel | null = null;
  let isStarting = false;
  let isShuttingDown = false;

  const start = async (): Promise<void> => {
    if (isStarting || isShuttingDown || ch) {
      return;
    }

    isStarting = true;
    try {
      conn = await client.connect();
      ch = await conn.channel();
      isShuttingDown = false;
    } finally {
      isStarting = false;
    }
  };

  const publish = async (items: readonly T[]): Promise<void> => {
    if (isShuttingDown) {
      throw new Error("Producer находится в состоянии завершения работы");
    }
    if (!ch) {
      throw new Error("Producer не запущен");
    }

    await pTimeout(
      Promise.all(
        items.map((item) =>
          ch!.basicPublish("", queue, JSON.stringify(item), {
            deliveryMode: PERSISTENT,
          }),
        ),
      ),
      {
        milliseconds: publishTimeoutMs,
        message: "Таймаут при публикации сообщений в RabbitMQ",
      },
    );
  };

  const shutdown = async (): Promise<void> => {
    if (isStarting || isShuttingDown || !ch) {
      return;
    }

    isShuttingDown = true;
    try {
      await ch.close();
      ch = null;

      if (conn) {
        await conn.close();
        conn = null;
      }
    } finally {
      isShuttingDown = false;
    }
  };

  const checkHealth = async (): Promise<void> => {
    let tempConn: AMQPBaseClient | null = null;
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

  return { start, publish, shutdown, checkHealth };
};
