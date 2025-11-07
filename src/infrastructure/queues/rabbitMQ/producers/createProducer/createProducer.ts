import { AMQPClient, AMQPChannel } from "@cloudamqp/amqp-client";
import pTimeout from "p-timeout";

import { ProducerConfig } from "./interfaces/ProducerConfig.js";
import { Producer } from "../../../../../application/ports/Producer.js";

const DEFAULT_HEALTHCHECK_TIMEOUT = 5000;
const PERSISTENT = 2;
const RETRY_COUNT = 0;

type AMQPConnection =
  ReturnType<AMQPClient["connect"]> extends Promise<infer T> ? T : never;

export const createProducer = <T>(
  config: ProducerConfig,
): Producer<T> => {
  const { url, queue } = config;
  const client = new AMQPClient(url);

  let conn: AMQPConnection | null = null;
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

  const publish = async (items: T[]): Promise<void> => {
    if (isShuttingDown) {
      throw new Error("Producer находится в состоянии завершения работы");
    }
    if (!ch) {
      throw new Error("Producer не запущен");
    }

    await Promise.all(
      items.map((item) =>
        ch!.basicPublish("", queue, JSON.stringify(item), {
          deliveryMode: PERSISTENT,
          headers: {
            "x-retry-count": RETRY_COUNT,
          },
        }),
      ),
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

  return { start, publish, shutdown, checkHealth };
};
