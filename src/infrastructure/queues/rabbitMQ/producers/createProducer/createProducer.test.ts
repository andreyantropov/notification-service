import { AMQPClient } from "@cloudamqp/amqp-client";
import { describe, it, expect, vi, beforeEach, afterEach, Mock } from "vitest";

import { createProducer } from "./createProducer.js";
import { ProducerConfig } from "./interfaces/ProducerConfig.js";

vi.mock("@cloudamqp/amqp-client");

interface TestAMQPChannel {
  basicPublish(
    exchange: string,
    routingKey: string,
    data: string | Buffer | null,
    properties?: unknown,
  ): Promise<boolean>;
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

describe("Producer", () => {
  const mockConfig: ProducerConfig = {
    url: "amqp://localhost",
    queue: "test-queue",
  };

  let mockClient: Mocked<TestAMQPClient>;
  let mockConnection: Mocked<TestAMQPConnection>;
  let mockChannel: Mocked<TestAMQPChannel>;

  beforeEach(() => {
    mockChannel = {
      basicPublish: vi.fn(),
      close: vi.fn(),
    };

    mockConnection = {
      channel: vi.fn(),
      close: vi.fn(),
    };

    mockClient = {
      connect: vi.fn(),
    };

    mockChannel.close.mockResolvedValue(undefined);
    mockConnection.channel.mockResolvedValue(mockChannel);
    mockConnection.close.mockResolvedValue(undefined);
    mockClient.connect.mockResolvedValue(mockConnection);

    (AMQPClient as Mock).mockImplementation(() => mockClient);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("publish", () => {
    it("should publish all items to the configured queue with persistent delivery mode", async () => {
      const producer = createProducer<{ id: number }>(mockConfig);
      await producer.start();
      const items = [{ id: 1 }, { id: 2 }];

      await producer.publish(items);

      expect(mockChannel.basicPublish).toHaveBeenCalledTimes(2);
      expect(mockChannel.basicPublish).toHaveBeenNthCalledWith(
        1,
        "",
        "test-queue",
        JSON.stringify({ id: 1 }),
        {
          deliveryMode: 2,
        },
      );
      expect(mockChannel.basicPublish).toHaveBeenNthCalledWith(
        2,
        "",
        "test-queue",
        JSON.stringify({ id: 2 }),
        {
          deliveryMode: 2,
        },
      );
    });

    it("should throw if publish is called before start", async () => {
      const producer = createProducer<{ id: number }>(mockConfig);
      const items = [{ id: 1 }];

      await expect(producer.publish(items)).rejects.toThrow(
        "Producer не запущен",
      );
    });

    it("should throw if publish is called during shutdown", async () => {
      const producer = createProducer<{ id: number }>(mockConfig);
      await producer.start();
      await producer.shutdown();

      await expect(producer.publish([{ id: 1 }])).rejects.toThrow(
        "Producer не запущен",
      );
    });

    it("should handle empty items array without publishing", async () => {
      const producer = createProducer<{ id: number }>(mockConfig);
      await producer.start();
      const items: { id: number }[] = [];

      await producer.publish(items);

      expect(mockChannel.basicPublish).not.toHaveBeenCalled();
    });

    it("should propagate publish errors", async () => {
      const publishError = new Error("Publish failed");
      mockChannel.basicPublish.mockRejectedValueOnce(publishError);

      const producer = createProducer<{ id: number }>(mockConfig);
      await producer.start();
      const items = [{ id: 1 }];

      await expect(producer.publish(items)).rejects.toThrow("Publish failed");
    });
  });

  describe("lifecycle", () => {
    it("start should connect and create channel", async () => {
      const producer = createProducer<{ id: number }>(mockConfig);
      await producer.start();

      expect(mockClient.connect).toHaveBeenCalledOnce();
      expect(mockConnection.channel).toHaveBeenCalledOnce();
    });

    it("shutdown should close channel and connection", async () => {
      const producer = createProducer<{ id: number }>(mockConfig);
      await producer.start();
      await producer.shutdown();

      expect(mockChannel.close).toHaveBeenCalledOnce();
      expect(mockConnection.close).toHaveBeenCalledOnce();
    });

    it("multiple start calls should not reconnect", async () => {
      const producer = createProducer<{ id: number }>(mockConfig);
      await producer.start();
      await producer.start();

      expect(mockClient.connect).toHaveBeenCalledOnce();
    });
  });

  describe("checkHealth", () => {
    it("should resolve successfully when connection is established", async () => {
      const producer = createProducer<{ id: number }>(mockConfig);
      await expect(producer.checkHealth!()).resolves.toBeUndefined();

      expect(mockClient.connect).toHaveBeenCalledOnce();
    });

    it("should reject with descriptive error when connection fails", async () => {
      const connectionError = new Error("Connection refused");
      mockClient.connect.mockRejectedValueOnce(connectionError);

      const producer = createProducer<{ id: number }>(mockConfig);
      await expect(producer.checkHealth!()).rejects.toThrow(
        "RabbitMQ недоступен",
      );
    });

    it("should close temporary connection in health check", async () => {
      const producer = createProducer<{ id: number }>(mockConfig);
      await producer.checkHealth!();

      expect(mockConnection.close).toHaveBeenCalledOnce();
    });
  });
});
