import { AMQPClient } from "@cloudamqp/amqp-client";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { Mock } from "vitest";

import { createRetryConsumer } from "./createRetryConsumer.js";

vi.mock("@cloudamqp/amqp-client");

interface MockAMQPMessage {
  body: Uint8Array | null;
  properties?: { headers?: Record<string, unknown> };
  ack: Mock<() => Promise<void>>;
  nack: Mock<(requeue: boolean, multiple: boolean) => Promise<void>>;
}

interface MockAMQPChannel {
  queueDeclare: Mock<(queue: string, options: unknown) => Promise<void>>;
  basicConsume: Mock<
    (
      queue: string,
      options: unknown,
      callback: (msg: MockAMQPMessage) => void,
    ) => Promise<void>
  >;
  basicPublish: Mock<
    (
      exchange: string,
      routingKey: string,
      content: Uint8Array | null,
      options: { headers: Record<string, unknown>; deliveryMode: number },
    ) => Promise<void>
  >;
  close: Mock<() => Promise<void>>;
}

interface MockAMQPConnection {
  channel: Mock<() => Promise<MockAMQPChannel>>;
  close: Mock<() => Promise<void>>;
}

interface MockAMQPClient {
  connect: Mock<() => Promise<MockAMQPConnection>>;
}

type Mocked<T> = {
  [K in keyof T]: T[K] extends (...args: infer A) => infer R
  ? Mock<(...args: A) => R>
  : T[K];
};

const createMessage = (
  body: unknown,
  headers: Record<string, unknown> = {},
): MockAMQPMessage => {
  const bodyBuffer =
    body === null ? null : new TextEncoder().encode(JSON.stringify(body));
  return {
    body: bodyBuffer,
    properties: { headers },
    ack: vi.fn().mockResolvedValue(undefined),
    nack: vi.fn().mockResolvedValue(undefined),
  };
};

describe("createRetryConsumer", () => {
  const baseConfig = {
    url: "amqp://test",
    queue: "retry-router",
  };

  let mockClient: Mocked<MockAMQPClient>;
  let mockConn: Mocked<MockAMQPConnection>;
  let mockChannel: Mocked<MockAMQPChannel>;
  let consumeCallback: ((msg: MockAMQPMessage) => void) | null = null;
  let onError: Mock<(err: unknown) => void>;
  let handler: Mock<(retryCount: number) => string>;

  beforeEach(() => {
    onError = vi.fn();
    handler = vi.fn();

    mockChannel = {
      queueDeclare: vi.fn(),
      basicConsume: vi.fn((_, __, cb) => {
        consumeCallback = cb;
        return Promise.resolve();
      }),
      basicPublish: vi.fn(),
      close: vi.fn(),
    };

    mockConn = {
      channel: vi.fn().mockResolvedValue(mockChannel),
      close: vi.fn(),
    };

    mockClient = {
      connect: vi.fn().mockResolvedValue(mockConn),
    };

    (AMQPClient as Mock).mockImplementation(() => mockClient);
  });

  afterEach(() => {
    vi.clearAllMocks();
    consumeCallback = null;
  });

  it("should declare the configured queue and start consuming", async () => {
    const consumer = createRetryConsumer({ handler }, baseConfig);
    await consumer.start();

    expect(mockChannel.queueDeclare).toHaveBeenCalledWith("retry-router", {
      durable: true,
    });
    expect(mockChannel.basicConsume).toHaveBeenCalled();
    expect(consumeCallback).not.toBeNull();
  });

  it("should ack and skip processing if message body is null", async () => {
    const consumer = createRetryConsumer({ handler }, baseConfig);
    await consumer.start();

    const msg = createMessage(null);
    consumeCallback!(msg);

    await consumer.shutdown();

    expect(msg.ack).toHaveBeenCalled();
    expect(mockChannel.basicPublish).not.toHaveBeenCalled();
    expect(handler).not.toHaveBeenCalled();
  });

  it("should call handler with retry count and route to returned queue", async () => {
    handler.mockReturnValue("target-queue");

    const consumer = createRetryConsumer({ handler }, baseConfig);
    await consumer.start();

    const msg = createMessage({ id: 1 }, { "x-retry-count": 0 });
    consumeCallback!(msg);

    await consumer.shutdown();

    expect(handler).toHaveBeenCalledWith(1);
    expect(mockChannel.basicPublish).toHaveBeenCalledWith(
      "",
      "target-queue",
      expect.any(Uint8Array),
      expect.objectContaining({
        headers: expect.objectContaining({
          "x-retry-count": 1,
        }),
        deliveryMode: 2,
      }),
    );
    expect(msg.ack).toHaveBeenCalled();
  });

  it("should route message with x-retry-count=0 and increment counter", async () => {
    handler.mockReturnValue("retry-1");

    const consumer = createRetryConsumer({ handler }, baseConfig);
    await consumer.start();

    const msg = createMessage({ id: 1 }, { "x-retry-count": 0 });
    consumeCallback!(msg);

    await consumer.shutdown();

    expect(handler).toHaveBeenCalledWith(1);
    expect(mockChannel.basicPublish).toHaveBeenCalledWith(
      "",
      "retry-1",
      expect.any(Uint8Array),
      expect.objectContaining({
        headers: expect.objectContaining({
          "x-retry-count": 1,
        }),
        deliveryMode: 2,
      }),
    );
    expect(msg.ack).toHaveBeenCalled();
  });

  it("should route message with x-retry-count=1 and increment counter", async () => {
    handler.mockReturnValue("retry-2");

    const consumer = createRetryConsumer({ handler }, baseConfig);
    await consumer.start();

    const msg = createMessage({ id: 1 }, { "x-retry-count": 1 });
    consumeCallback!(msg);

    await consumer.shutdown();

    expect(handler).toHaveBeenCalledWith(2);
    expect(mockChannel.basicPublish).toHaveBeenCalledWith(
      "",
      "retry-2",
      expect.any(Uint8Array),
      expect.objectContaining({
        headers: expect.objectContaining({
          "x-retry-count": 2,
        }),
        deliveryMode: 2,
      }),
    );
    expect(msg.ack).toHaveBeenCalled();
  });

  it("should treat messages with invalid or missing x-retry-count as retry-count=0", async () => {
    const testCases = [
      { description: "missing header", headers: {} },
      { description: "null", headers: { "x-retry-count": null } },
      {
        description: "undefined value",
        headers: { "x-retry-count": undefined },
      },
      { description: "string", headers: { "x-retry-count": "invalid" } },
      { description: "empty string", headers: { "x-retry-count": "" } },
      { description: "float", headers: { "x-retry-count": 3.5 } },
      { description: "negative", headers: { "x-retry-count": -1 } },
      { description: "NaN", headers: { "x-retry-count": NaN } },
      { description: "boolean", headers: { "x-retry-count": true } },
    ];

    for (const { headers } of testCases) {
      handler.mockReturnValue("target-queue");

      const consumer = createRetryConsumer({ handler }, baseConfig);
      await consumer.start();

      const msg = createMessage({ id: 1 }, headers);
      consumeCallback!(msg);
      await consumer.shutdown();

      expect(handler).toHaveBeenCalledWith(1);
      expect(mockChannel.basicPublish).toHaveBeenCalledWith(
        "",
        "target-queue",
        expect.any(Uint8Array),
        expect.objectContaining({
          headers: expect.objectContaining({
            "x-retry-count": 1,
          }),
          deliveryMode: 2,
        }),
      );
      expect(msg.ack).toHaveBeenCalled();

      vi.clearAllMocks();
      mockChannel.basicPublish.mockClear();
      msg.ack.mockClear();
      consumeCallback = null;
    }
  });

  it("should handle errors during routing by nacking message", async () => {
    handler.mockImplementation(() => {
      throw new Error("Handler failed");
    });

    const configWithOnError = {
      ...baseConfig,
      onError,
    };

    const consumer = createRetryConsumer({ handler }, configWithOnError);
    await consumer.start();

    const msg = createMessage({ id: 1 }, { "x-retry-count": 0 });
    consumeCallback!(msg);

    await consumer.shutdown();

    expect(onError).toHaveBeenCalledWith(expect.any(Error));
    expect(msg.nack).toHaveBeenCalledWith(false, false);
    expect(mockChannel.basicPublish).not.toHaveBeenCalled();
  });

  it("should handle errors during publish by nacking message", async () => {
    handler.mockReturnValue("target-queue");
    mockChannel.basicPublish.mockRejectedValueOnce(new Error("Publish failed"));

    const configWithOnError = {
      ...baseConfig,
      onError,
    };

    const consumer = createRetryConsumer({ handler }, configWithOnError);
    await consumer.start();

    const msg = createMessage({ id: 1 }, { "x-retry-count": 0 });
    consumeCallback!(msg);

    await consumer.shutdown();

    expect(onError).toHaveBeenCalledWith(expect.any(Error));
    expect(msg.nack).toHaveBeenCalledWith(false, false);
    expect(mockChannel.basicPublish).toHaveBeenCalledTimes(1);
  });

  it("should nack message if handler fails", async () => {
    handler.mockImplementation(() => {
      throw new Error("Handler failed");
    });

    const configWithOnError = {
      ...baseConfig,
      onError,
    };

    const consumer = createRetryConsumer({ handler }, configWithOnError);
    await consumer.start();

    const msg = createMessage({ id: 1 }, { "x-retry-count": 0 });
    consumeCallback!(msg);

    await consumer.shutdown();

    expect(msg.nack).toHaveBeenCalledWith(false, false);
    expect(onError).toHaveBeenCalledTimes(1);
  });

  it("should support health check", async () => {
    const consumer = createRetryConsumer({ handler }, baseConfig);
    await expect(consumer.checkHealth?.()).resolves.toBeUndefined();
  });

  it("should reject health check when connection fails", async () => {
    mockClient.connect.mockRejectedValueOnce(new Error("Connection failed"));
    const consumer = createRetryConsumer({ handler }, baseConfig);
    await expect(consumer.checkHealth?.()).rejects.toThrow(
      "RabbitMQ недоступен",
    );
  });

  it("should shut down gracefully", async () => {
    const consumer = createRetryConsumer({ handler }, baseConfig);
    await consumer.start();
    await consumer.shutdown();

    expect(mockChannel.close).toHaveBeenCalled();
    expect(mockConn.close).toHaveBeenCalled();
  });

  it("should not process messages during shutdown", async () => {
    const consumer = createRetryConsumer({ handler }, baseConfig);
    await consumer.start();

    const shutdownPromise = consumer.shutdown();

    const msg = createMessage({ id: 1 }, { "x-retry-count": 0 });
    consumeCallback!(msg);

    await shutdownPromise;

    expect(handler).not.toHaveBeenCalled();
    expect(mockChannel.basicPublish).not.toHaveBeenCalled();
    expect(msg.ack).not.toHaveBeenCalled();
  });
});
