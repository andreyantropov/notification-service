import { AMQPClient } from "@cloudamqp/amqp-client";
import { describe, it, expect, vi, beforeEach, afterEach, Mock } from "vitest";

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
  const config = {
    url: "amqp://test",
    queue: "retry-router",
  };

  let mockClient: Mocked<MockAMQPClient>;
  let mockConn: Mocked<MockAMQPConnection>;
  let mockChannel: Mocked<MockAMQPChannel>;
  let consumeCallback: ((msg: MockAMQPMessage) => void) | null = null;
  let onError: Mock<(err: unknown) => void>;

  beforeEach(() => {
    onError = vi.fn();

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
    const consumer = createRetryConsumer({ ...config, onError });
    await consumer.start();

    expect(mockChannel.queueDeclare).toHaveBeenCalledWith("retry-router", {
      durable: true,
    });
    expect(mockChannel.basicConsume).toHaveBeenCalled();
    expect(consumeCallback).not.toBeNull();
  });

  it("should ack and skip processing if message body is null", async () => {
    const consumer = createRetryConsumer({ ...config, onError });
    await consumer.start();

    const msg = createMessage(null);
    consumeCallback!(msg);

    await consumer.shutdown();

    expect(msg.ack).toHaveBeenCalled();
    expect(mockChannel.basicPublish).not.toHaveBeenCalled();
  });

  it("should route message with x-retry-count=0 to retry-1 and increment counter", async () => {
    const consumer = createRetryConsumer({ ...config, onError });
    await consumer.start();

    const msg = createMessage({ id: 1 }, { "x-retry-count": 0 });
    consumeCallback!(msg);

    await consumer.shutdown();

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

  it("should route message with x-retry-count=1 to retry-2 and increment counter", async () => {
    const consumer = createRetryConsumer({ ...config, onError });
    await consumer.start();

    const msg = createMessage({ id: 1 }, { "x-retry-count": 1 });
    consumeCallback!(msg);

    await consumer.shutdown();

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

  it("should route message with x-retry-count=2 to dlq with incremented counter", async () => {
    const consumer = createRetryConsumer({ ...config, onError });
    await consumer.start();

    const msg = createMessage({ id: 1 }, { "x-retry-count": 2 });
    consumeCallback!(msg);

    await consumer.shutdown();

    expect(mockChannel.basicPublish).toHaveBeenCalledWith(
      "",
      "dlq",
      expect.any(Uint8Array),
      expect.objectContaining({
        headers: expect.objectContaining({
          "x-retry-count": 3,
        }),
        deliveryMode: 2,
      }),
    );
    expect(msg.ack).toHaveBeenCalled();
  });

  it("should route messages with invalid or missing x-retry-count directly to dlq preserving original headers", async () => {
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
      const consumer = createRetryConsumer({ ...config, onError });
      await consumer.start();

      const msg = createMessage({ id: 1 }, headers);
      consumeCallback!(msg);
      await consumer.shutdown();

      expect(mockChannel.basicPublish).toHaveBeenCalledWith(
        "",
        "dlq",
        expect.any(Uint8Array),
        expect.objectContaining({
          headers: expect.objectContaining(headers),
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

  it("should handle errors during routing by sending to dlq with fallback headers", async () => {
    mockChannel.basicPublish.mockRejectedValueOnce(new Error("Publish failed"));

    const consumer = createRetryConsumer({ ...config, onError });
    await consumer.start();

    const msg = createMessage({ id: 1 }, { "x-retry-count": 0 });
    consumeCallback!(msg);

    await consumer.shutdown();

    expect(onError).toHaveBeenCalledWith(expect.any(Error));
    expect(mockChannel.basicPublish).toHaveBeenCalledTimes(2);
    expect(mockChannel.basicPublish).toHaveBeenLastCalledWith(
      "",
      "dlq",
      expect.any(Uint8Array),
      expect.objectContaining({
        headers: expect.objectContaining({
          "x-retry-consumer-failure": true,
          "x-original-retry-count": 0,
        }),
        deliveryMode: 2,
      }),
    );
    expect(msg.ack).toHaveBeenCalled();
  });

  it("should nack message if even DLQ fallback fails", async () => {
    mockChannel.basicPublish.mockRejectedValue(new Error("Publish failed"));

    const consumer = createRetryConsumer({ ...config, onError });
    await consumer.start();

    const msg = createMessage({ id: 1 }, { "x-retry-count": 0 });
    consumeCallback!(msg);

    await consumer.shutdown();

    expect(msg.nack).toHaveBeenCalledWith(false, false);
    expect(onError).toHaveBeenCalledTimes(2);
  });

  it("should support health check", async () => {
    const consumer = createRetryConsumer({ ...config, onError });
    await expect(consumer.checkHealth?.()).resolves.toBeUndefined();
  });

  it("should reject health check when connection fails", async () => {
    mockClient.connect.mockRejectedValueOnce(new Error("Connection failed"));
    const consumer = createRetryConsumer({ ...config, onError });
    await expect(consumer.checkHealth?.()).rejects.toThrow(
      "RabbitMQ недоступен",
    );
  });

  it("should shut down gracefully", async () => {
    const consumer = createRetryConsumer({ ...config, onError });
    await consumer.start();
    await consumer.shutdown();

    expect(mockChannel.close).toHaveBeenCalled();
    expect(mockConn.close).toHaveBeenCalled();
  });
});
