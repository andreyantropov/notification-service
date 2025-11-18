import { AMQPClient } from "@cloudamqp/amqp-client";
import { describe, it, expect, vi, beforeEach, afterEach, Mock } from "vitest";

import { createBatchConsumer } from "./createBatchConsumer.js";
import { BatchConsumerConfig } from "./interfaces/BatchConsumerConfig.js";

vi.mock("@cloudamqp/amqp-client");

interface TestAMQPMessage {
  deliveryTag: number;
  body: Buffer | null;
  ack: () => Promise<void>;
  nack: (requeue?: boolean, multiple?: boolean) => Promise<void>;
}

interface TestAMQPChannel {
  queueDeclare(queue: string, options?: unknown): Promise<void>;
  basicQos(prefetchCount: number): Promise<void>;
  basicConsume(
    queue: string,
    options: unknown,
    callback: (msg: TestAMQPMessage) => void,
  ): Promise<void>;
  close(): Promise<void>;
}

interface TestAMQPConnection {
  channel(): Promise<TestAMQPChannel>;
  close(): Promise<void>;
}

interface TestAMQPClient {
  connect(): Promise<TestAMQPConnection>;
}

type Mocked<T> = {
  [K in keyof T]: T[K] extends (...args: infer A) => infer R
    ? Mock<(...args: A) => R>
    : T[K];
};

describe("RabbitMQConsumer", () => {
  const mockConfig: BatchConsumerConfig = {
    url: "amqp://localhost",
    queue: "notifications",
    maxBatchSize: 100,
  };

  let mockClient: Mocked<TestAMQPClient>;
  let mockConnection: Mocked<TestAMQPConnection>;
  let mockChannel: Mocked<TestAMQPChannel>;
  let consumeCallback: ((msg: TestAMQPMessage) => void) | null = null;

  beforeEach(() => {
    mockChannel = {
      queueDeclare: vi.fn().mockResolvedValue(undefined),
      basicQos: vi.fn().mockResolvedValue(undefined),
      basicConsume: vi.fn((queue, options, callback) => {
        consumeCallback = callback;
        return Promise.resolve();
      }),
      close: vi.fn().mockResolvedValue(undefined),
    };

    mockConnection = {
      channel: vi.fn().mockResolvedValue(mockChannel),
      close: vi.fn().mockResolvedValue(undefined),
    };

    mockClient = {
      connect: vi.fn().mockResolvedValue(mockConnection),
    };

    (AMQPClient as Mock).mockImplementation(() => mockClient);
  });

  afterEach(() => {
    vi.clearAllMocks();
    consumeCallback = null;
  });

  const createMockMessage = (
    deliveryTag: number,
    body: unknown | null,
  ): TestAMQPMessage => {
    const ack = vi.fn().mockResolvedValue(undefined);
    const nack = vi.fn().mockResolvedValue(undefined);
    return {
      deliveryTag,
      body: body === null ? null : Buffer.from(JSON.stringify(body)),
      ack,
      nack,
    };
  };

  const createConsumer = <T>(
    handler: (items: T[]) => Promise<Array<{ success: boolean }>>,
  ) => {
    return createBatchConsumer({ handler }, mockConfig);
  };

  describe("start", () => {
    it("should declare the queue and start consuming", async () => {
      const handler = vi.fn().mockResolvedValue([{ success: true }]);
      const consumer = createConsumer<{ id: number }>(handler);

      await consumer.start();

      expect(mockChannel.queueDeclare).toHaveBeenCalledWith("notifications", {
        durable: true,
      });
      expect(mockChannel.basicQos).toHaveBeenCalledWith(100);
      expect(mockChannel.basicConsume).toHaveBeenCalledTimes(1);
      expect(consumeCallback).not.toBeNull();

      const msg = createMockMessage(1, { id: 1 });
      consumeCallback!(msg);

      await consumer.shutdown();

      expect(handler).toHaveBeenCalledWith([{ id: 1 }]);
      expect(msg.ack).toHaveBeenCalled();
      expect(msg.nack).not.toHaveBeenCalled();
    });

    it("should nack messages with invalid JSON", async () => {
      const handler = vi.fn();
      const consumer = createConsumer<{ id: number }>(handler);

      await consumer.start();

      const msg = createMockMessage(1, "invalid json");
      msg.body = Buffer.from("invalid json");
      consumeCallback!(msg);

      await consumer.shutdown();

      expect(handler).not.toHaveBeenCalled();
      expect(msg.nack).toHaveBeenCalledWith(false, false);
    });

    it("should ack messages with null body", async () => {
      const handler = vi.fn();
      const consumer = createConsumer<{ id: number }>(handler);

      await consumer.start();

      const msg = createMockMessage(1, null);
      consumeCallback!(msg);

      await consumer.shutdown();

      expect(handler).not.toHaveBeenCalled();
      expect(msg.ack).toHaveBeenCalled();
    });

    it("should handle batch processing and individual ack/nack", async () => {
      const handler = vi
        .fn()
        .mockResolvedValue([{ success: true }, { success: false }]);
      const consumer = createConsumer<{ id: number }>(handler);

      await consumer.start();

      const msg1 = createMockMessage(1, { id: 1 });
      const msg2 = createMockMessage(2, { id: 2 });

      consumeCallback!(msg1);
      consumeCallback!(msg2);

      await consumer.shutdown();

      expect(handler).toHaveBeenCalledWith([{ id: 1 }, { id: 2 }]);
      expect(msg1.ack).toHaveBeenCalled();
      expect(msg2.nack).toHaveBeenCalledWith(false, false);
    });

    it("should flush on shutdown if batch is not empty", async () => {
      const handler = vi.fn().mockResolvedValue([{ success: true }]);
      const consumer = createConsumer<{ id: number }>(handler);

      await consumer.start();

      const msg = createMockMessage(1, { id: 1 });
      consumeCallback!(msg);

      await consumer.shutdown();

      expect(handler).toHaveBeenCalledWith([{ id: 1 }]);
    });

    it("should nack all items if handler throws", async () => {
      const handler = vi.fn().mockRejectedValue(new Error("Boom!"));
      const consumer = createConsumer<{ id: number }>(handler);

      await consumer.start();

      const msg1 = createMockMessage(1, { id: 1 });
      const msg2 = createMockMessage(2, { id: 2 });

      consumeCallback!(msg1);
      consumeCallback!(msg2);

      await consumer.shutdown();

      expect(msg1.nack).toHaveBeenCalledWith(false, false);
      expect(msg2.nack).toHaveBeenCalledWith(false, false);
    });

    it("should nack all items if handler returns wrong length", async () => {
      const handler = vi.fn().mockResolvedValue([{ success: true }]);
      const consumer = createConsumer<{ id: number }>(handler);

      await consumer.start();

      const msg1 = createMockMessage(1, { id: 1 });
      const msg2 = createMockMessage(2, { id: 2 });

      consumeCallback!(msg1);
      consumeCallback!(msg2);

      await consumer.shutdown();

      expect(msg1.nack).toHaveBeenCalledWith(false, false);
      expect(msg2.nack).toHaveBeenCalledWith(false, false);
    });
  });

  describe("checkHealth", () => {
    it("should resolve successfully when connection is established", async () => {
      const handler = vi.fn();
      const consumer = createConsumer<{ id: number }>(handler);
      await expect(consumer.checkHealth!()).resolves.toBeUndefined();
    });

    it("should reject when connection fails", async () => {
      mockClient.connect.mockRejectedValueOnce(new Error("Connection failed"));
      const handler = vi.fn();
      const consumer = createConsumer<{ id: number }>(handler);
      await expect(consumer.checkHealth!()).rejects.toThrow(
        "RabbitMQ недоступен",
      );
    });
  });
});
