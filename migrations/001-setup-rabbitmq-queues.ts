import { AMQPClient } from "@cloudamqp/amqp-client";

const RABBIT_URL = process.env.RABBIT_URL;

const setupRabbitMQ = async (): Promise<void> => {
  if (!RABBIT_URL) {
    console.error("Ошибка: переменная окружения RABBIT_URL не задана");
    process.exit(1);
  }

  const client = new AMQPClient(RABBIT_URL);
  const conn = await client.connect();
  const ch = await conn.channel();

  const createdQueues: string[] = [];

  try {
    await ch.queueDeclare("notifications.retry.router.dlq", { durable: true });
    createdQueues.push("notifications.retry.router.dlq");

    await ch.queueDeclare("notifications.dlq", { durable: true });
    createdQueues.push("notifications.dlq");

    await ch.queueDeclare("notifications.retry.2h", {
      durable: true,
      arguments: {
        "x-dead-letter-exchange": "",
        "x-dead-letter-routing-key": "notifications",
        "x-message-ttl": 2 * 60 * 60 * 1000,
      },
    } as Parameters<typeof ch.queueDeclare>[1]);
    createdQueues.push("notifications.retry.2h");

    await ch.queueDeclare("notifications.retry.30m", {
      durable: true,
      arguments: {
        "x-dead-letter-exchange": "",
        "x-dead-letter-routing-key": "notifications",
        "x-message-ttl": 30 * 60 * 1000,
      },
    } as Parameters<typeof ch.queueDeclare>[1]);
    createdQueues.push("notifications.retry.30m");

    await ch.queueDeclare("notifications.retry.router", {
      durable: true,
      arguments: {
        "x-dead-letter-exchange": "",
        "x-dead-letter-routing-key": "notifications.retry.router.dlq",
      },
    } as Parameters<typeof ch.queueDeclare>[1]);
    createdQueues.push("notifications.retry.router");

    await ch.queueDeclare("notifications", {
      durable: true,
      arguments: {
        "x-dead-letter-exchange": "",
        "x-dead-letter-routing-key": "notifications.retry.router",
      },
    } as Parameters<typeof ch.queueDeclare>[1]);
    createdQueues.push("notifications");

    console.log("Все очереди успешно созданы");
  } catch (error) {
    console.error("Ошибка при настройке RabbitMQ:", error);

    for (const q of [...createdQueues].reverse()) {
      try {
        await ch.queueDelete(q);
        console.log(`Откат: очередь ${q} удалена`);
      } catch (e) {
        console.warn(`Не удалось удалить очередь ${q}:`, e);
      }
    }

    throw error;
  } finally {
    await ch.close();
    await conn.close();
  }
};

export default setupRabbitMQ;
