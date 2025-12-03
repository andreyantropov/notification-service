import { describe, it, expect, vi, beforeEach } from "vitest";

import { createCheckNotificationServiceHealthUseCase } from "./createCheckNotificationServiceHealthUseCase.js";
import { Consumer, Producer } from "../../../application/ports/index.js";
import { Notification } from "../../../domain/types/index.js";
import { NotificationDeliveryService } from "../../services/createNotificationDeliveryService/index.js";

const createMockProducer = (hasCheckHealth = false): Producer<Notification> => {
  const producer: Producer<Notification> = {
    start: vi.fn(),
    publish: vi.fn(),
    shutdown: vi.fn(),
  };
  if (hasCheckHealth) {
    producer.checkHealth = vi.fn().mockResolvedValue(undefined);
  }
  return producer;
};

const createMockConsumer = (hasCheckHealth = false): Consumer => {
  const consumer: Consumer = {
    start: vi.fn(),
    shutdown: vi.fn(),
  };
  if (hasCheckHealth) {
    consumer.checkHealth = vi.fn().mockResolvedValue(undefined);
  }
  return consumer;
};

describe("CheckNotificationServiceHealthUseCase", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should call checkHealth on all components when implemented", async () => {
    const serviceCheckHealth = vi.fn().mockResolvedValue(undefined);
    const producerCheckHealth = vi.fn().mockResolvedValue(undefined);
    const batchConsumerCheckHealth = vi.fn().mockResolvedValue(undefined);
    const retryConsumerCheckHealth = vi.fn().mockResolvedValue(undefined);

    const notificationDeliveryService: NotificationDeliveryService = {
      send: vi.fn(),
      checkHealth: serviceCheckHealth,
    };
    const producer = createMockProducer();
    producer.checkHealth = producerCheckHealth;
    const batchConsumer = createMockConsumer();
    batchConsumer.checkHealth = batchConsumerCheckHealth;
    const retryConsumer = createMockConsumer();
    retryConsumer.checkHealth = retryConsumerCheckHealth;

    const useCase = createCheckNotificationServiceHealthUseCase({
      notificationDeliveryService,
      producer,
      batchConsumer,
      retryConsumer,
    });

    await useCase.checkHealth();

    expect(serviceCheckHealth).toHaveBeenCalledTimes(1);
    expect(producer.checkHealth).toHaveBeenCalledTimes(1);
    expect(batchConsumer.checkHealth).toHaveBeenCalledTimes(1);
    expect(retryConsumer.checkHealth).toHaveBeenCalledTimes(1);
  });

  it("should call only notificationDeliveryService.checkHealth when others lack it", async () => {
    const serviceCheckHealth = vi.fn().mockResolvedValue(undefined);
    const notificationDeliveryService: NotificationDeliveryService = {
      send: vi.fn(),
      checkHealth: serviceCheckHealth,
    };
    const producer = createMockProducer();
    const batchConsumer = createMockConsumer();
    const retryConsumer = createMockConsumer();

    const useCase = createCheckNotificationServiceHealthUseCase({
      notificationDeliveryService,
      producer,
      batchConsumer,
      retryConsumer,
    });

    await useCase.checkHealth();

    expect(serviceCheckHealth).toHaveBeenCalledTimes(1);
  });

  it("should call only producer.checkHealth when others lack it", async () => {
    const notificationDeliveryService: NotificationDeliveryService = {
      send: vi.fn(),
    };
    const producer = createMockProducer(true);
    const batchConsumer = createMockConsumer();
    const retryConsumer = createMockConsumer();

    const useCase = createCheckNotificationServiceHealthUseCase({
      notificationDeliveryService,
      producer,
      batchConsumer,
      retryConsumer,
    });

    await useCase.checkHealth();

    expect(producer.checkHealth).toHaveBeenCalledTimes(1);
  });

  it("should call only batchConsumer.checkHealth when others lack it", async () => {
    const notificationDeliveryService: NotificationDeliveryService = {
      send: vi.fn(),
    };
    const producer = createMockProducer();
    const batchConsumer = createMockConsumer(true);
    const retryConsumer = createMockConsumer();

    const useCase = createCheckNotificationServiceHealthUseCase({
      notificationDeliveryService,
      producer,
      batchConsumer,
      retryConsumer,
    });

    await useCase.checkHealth();

    expect(batchConsumer.checkHealth).toHaveBeenCalledTimes(1);
  });

  it("should call only retryConsumer.checkHealth when others lack it", async () => {
    const notificationDeliveryService: NotificationDeliveryService = {
      send: vi.fn(),
    };
    const producer = createMockProducer();
    const batchConsumer = createMockConsumer();
    const retryConsumer = createMockConsumer(true);

    const useCase = createCheckNotificationServiceHealthUseCase({
      notificationDeliveryService,
      producer,
      batchConsumer,
      retryConsumer,
    });

    await useCase.checkHealth();

    expect(retryConsumer.checkHealth).toHaveBeenCalledTimes(1);
  });

  it("should do nothing (and not throw) when no component has checkHealth", async () => {
    const notificationDeliveryService: NotificationDeliveryService = {
      send: vi.fn(),
    };
    const producer = createMockProducer();
    const batchConsumer = createMockConsumer();
    const retryConsumer = createMockConsumer();

    const useCase = createCheckNotificationServiceHealthUseCase({
      notificationDeliveryService,
      producer,
      batchConsumer,
      retryConsumer,
    });

    await expect(useCase.checkHealth()).resolves.toBeUndefined();
  });

  it("should propagate errors from notificationDeliveryService.checkHealth", async () => {
    const errorMessage = "Delivery service is unreachable";
    const serviceCheckHealth = vi
      .fn()
      .mockRejectedValue(new Error(errorMessage));
    const notificationDeliveryService: NotificationDeliveryService = {
      send: vi.fn(),
      checkHealth: serviceCheckHealth,
    };
    const producer = createMockProducer();
    const batchConsumer = createMockConsumer();
    const retryConsumer = createMockConsumer();

    const useCase = createCheckNotificationServiceHealthUseCase({
      notificationDeliveryService,
      producer,
      batchConsumer,
      retryConsumer,
    });

    await expect(useCase.checkHealth()).rejects.toThrow(errorMessage);
    expect(serviceCheckHealth).toHaveBeenCalledTimes(1);
  });

  it("should propagate errors from producer.checkHealth", async () => {
    const errorMessage = "Producer is unreachable";
    const notificationDeliveryService: NotificationDeliveryService = {
      send: vi.fn(),
    };
    const producer = createMockProducer();
    producer.checkHealth = vi.fn().mockRejectedValue(new Error(errorMessage));
    const batchConsumer = createMockConsumer();
    const retryConsumer = createMockConsumer();

    const useCase = createCheckNotificationServiceHealthUseCase({
      notificationDeliveryService,
      producer,
      batchConsumer,
      retryConsumer,
    });

    await expect(useCase.checkHealth()).rejects.toThrow(errorMessage);
    expect(producer.checkHealth).toHaveBeenCalledTimes(1);
  });

  it("should propagate errors from batchConsumer.checkHealth", async () => {
    const errorMessage = "Batch consumer is unreachable";
    const notificationDeliveryService: NotificationDeliveryService = {
      send: vi.fn(),
    };
    const producer = createMockProducer();
    const batchConsumer = createMockConsumer();
    batchConsumer.checkHealth = vi
      .fn()
      .mockRejectedValue(new Error(errorMessage));
    const retryConsumer = createMockConsumer();

    const useCase = createCheckNotificationServiceHealthUseCase({
      notificationDeliveryService,
      producer,
      batchConsumer,
      retryConsumer,
    });

    await expect(useCase.checkHealth()).rejects.toThrow(errorMessage);
    expect(batchConsumer.checkHealth).toHaveBeenCalledTimes(1);
  });

  it("should propagate errors from retryConsumer.checkHealth", async () => {
    const errorMessage = "Retry consumer is unreachable";
    const notificationDeliveryService: NotificationDeliveryService = {
      send: vi.fn(),
    };
    const producer = createMockProducer();
    const batchConsumer = createMockConsumer();
    const retryConsumer = createMockConsumer();
    retryConsumer.checkHealth = vi
      .fn()
      .mockRejectedValue(new Error(errorMessage));

    const useCase = createCheckNotificationServiceHealthUseCase({
      notificationDeliveryService,
      producer,
      batchConsumer,
      retryConsumer,
    });

    await expect(useCase.checkHealth()).rejects.toThrow(errorMessage);
    expect(retryConsumer.checkHealth).toHaveBeenCalledTimes(1);
  });

  it("should run all health checks in parallel and fail fast on first rejection (Promise.all semantics)", async () => {
    const serviceError = new Error("Service down");
    const producerError = new Error("Producer down");
    const batchError = new Error("Batch consumer down");
    const retryError = new Error("Retry consumer down");

    const notificationDeliveryService: NotificationDeliveryService = {
      send: vi.fn(),
      checkHealth: vi.fn().mockRejectedValue(serviceError),
    };
    const producer = createMockProducer();
    producer.checkHealth = vi.fn().mockRejectedValue(producerError);
    const batchConsumer = createMockConsumer();
    batchConsumer.checkHealth = vi.fn().mockRejectedValue(batchError);
    const retryConsumer = createMockConsumer();
    retryConsumer.checkHealth = vi.fn().mockRejectedValue(retryError);

    const useCase = createCheckNotificationServiceHealthUseCase({
      notificationDeliveryService,
      producer,
      batchConsumer,
      retryConsumer,
    });

    await expect(useCase.checkHealth()).rejects.toThrow();
    expect(notificationDeliveryService.checkHealth).toHaveBeenCalledTimes(1);
    expect(producer.checkHealth).toHaveBeenCalledTimes(1);
    expect(batchConsumer.checkHealth).toHaveBeenCalledTimes(1);
    expect(retryConsumer.checkHealth).toHaveBeenCalledTimes(1);
  });
});
