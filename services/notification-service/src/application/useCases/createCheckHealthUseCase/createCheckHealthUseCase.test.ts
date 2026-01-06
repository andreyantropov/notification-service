import { describe, it, expect, vi, beforeEach } from "vitest";

import { createCheckHealthUseCase } from "./createCheckHealthUseCase.js";
import type { Notification, Consumer, Producer } from "@notification-platform/shared";
import type { DeliveryService } from "../../services/createDeliveryService/index.js";

const createMockProducer = (
  checkHealth?: () => Promise<void>,
): Producer<Notification> => ({
  start: vi.fn(),
  publish: vi.fn(),
  shutdown: vi.fn(),
  ...(checkHealth ? { checkHealth } : {}),
});

const createMockConsumer = (checkHealth?: () => Promise<void>): Consumer => ({
  start: vi.fn(),
  shutdown: vi.fn(),
  ...(checkHealth ? { checkHealth } : {}),
});

const createMockDeliveryService = (
  checkHealth?: () => Promise<void>,
): DeliveryService => ({
  send: vi.fn(),
  ...(checkHealth ? { checkHealth } : {}),
});

describe("CheckNotificationServiceHealthUseCase", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should call checkHealth on all components when implemented", async () => {
    const serviceCheckHealth = vi.fn().mockResolvedValue(undefined);
    const producerCheckHealth = vi.fn().mockResolvedValue(undefined);
    const batchConsumerCheckHealth = vi.fn().mockResolvedValue(undefined);

    const deliveryService = createMockDeliveryService(serviceCheckHealth);
    const producer = createMockProducer(producerCheckHealth);
    const batchConsumer = createMockConsumer(batchConsumerCheckHealth);

    const useCase = createCheckHealthUseCase({
      deliveryService,
      producer,
      batchConsumer,
    });

    await useCase.checkHealth();

    expect(serviceCheckHealth).toHaveBeenCalledTimes(1);
    expect(producerCheckHealth).toHaveBeenCalledTimes(1);
    expect(batchConsumerCheckHealth).toHaveBeenCalledTimes(1);
  });

  it("should call only DeliveryService.checkHealth when others lack it", async () => {
    const serviceCheckHealth = vi.fn().mockResolvedValue(undefined);
    const deliveryService = createMockDeliveryService(serviceCheckHealth);
    const producer = createMockProducer();
    const batchConsumer = createMockConsumer();

    const useCase = createCheckHealthUseCase({
      deliveryService,
      producer,
      batchConsumer,
    });

    await useCase.checkHealth();

    expect(serviceCheckHealth).toHaveBeenCalledTimes(1);
  });

  it("should call only producer.checkHealth when others lack it", async () => {
    const deliveryService = createMockDeliveryService();
    const producer = createMockProducer(vi.fn().mockResolvedValue(undefined));
    const batchConsumer = createMockConsumer();

    const useCase = createCheckHealthUseCase({
      deliveryService,
      producer,
      batchConsumer,
    });

    await useCase.checkHealth();

    expect(producer.checkHealth).toHaveBeenCalledTimes(1);
  });

  it("should call only batchConsumer.checkHealth when others lack it", async () => {
    const deliveryService = createMockDeliveryService();
    const producer = createMockProducer();
    const batchConsumer = createMockConsumer(
      vi.fn().mockResolvedValue(undefined),
    );

    const useCase = createCheckHealthUseCase({
      deliveryService,
      producer,
      batchConsumer,
    });

    await useCase.checkHealth();

    expect(batchConsumer.checkHealth).toHaveBeenCalledTimes(1);
  });

  it("should do nothing (and not throw) when no component has checkHealth", async () => {
    const deliveryService = createMockDeliveryService();
    const producer = createMockProducer();
    const batchConsumer = createMockConsumer();

    const useCase = createCheckHealthUseCase({
      deliveryService,
      producer,
      batchConsumer,
    });

    await expect(useCase.checkHealth()).resolves.toBeUndefined();
  });

  it("should propagate errors from DeliveryService.checkHealth", async () => {
    const errorMessage = "Delivery service is unreachable";
    const serviceCheckHealth = vi
      .fn()
      .mockRejectedValue(new Error(errorMessage));
    const deliveryService = createMockDeliveryService(serviceCheckHealth);
    const producer = createMockProducer();
    const batchConsumer = createMockConsumer();

    const useCase = createCheckHealthUseCase({
      deliveryService,
      producer,
      batchConsumer,
    });

    await expect(useCase.checkHealth()).rejects.toThrow(errorMessage);
    expect(serviceCheckHealth).toHaveBeenCalledTimes(1);
  });

  it("should propagate errors from producer.checkHealth", async () => {
    const errorMessage = "Producer is unreachable";
    const deliveryService = createMockDeliveryService();
    const producer = createMockProducer(
      vi.fn().mockRejectedValue(new Error(errorMessage)),
    );
    const batchConsumer = createMockConsumer();

    const useCase = createCheckHealthUseCase({
      deliveryService,
      producer,
      batchConsumer,
    });

    await expect(useCase.checkHealth()).rejects.toThrow(errorMessage);
    expect(producer.checkHealth).toHaveBeenCalledTimes(1);
  });

  it("should propagate errors from batchConsumer.checkHealth", async () => {
    const errorMessage = "Batch consumer is unreachable";
    const deliveryService = createMockDeliveryService();
    const producer = createMockProducer();
    const batchConsumer = createMockConsumer(
      vi.fn().mockRejectedValue(new Error(errorMessage)),
    );

    const useCase = createCheckHealthUseCase({
      deliveryService,
      producer,
      batchConsumer,
    });

    await expect(useCase.checkHealth()).rejects.toThrow(errorMessage);
    expect(batchConsumer.checkHealth).toHaveBeenCalledTimes(1);
  });

  it("should run all health checks in parallel and fail fast on first rejection (Promise.all semantics)", async () => {
    const serviceError = new Error("Service down");
    const producerError = new Error("Producer down");
    const batchError = new Error("Batch consumer down");

    const deliveryService = createMockDeliveryService(
      vi.fn().mockRejectedValue(serviceError),
    );
    const producer = createMockProducer(
      vi.fn().mockRejectedValue(producerError),
    );
    const batchConsumer = createMockConsumer(
      vi.fn().mockRejectedValue(batchError),
    );

    const useCase = createCheckHealthUseCase({
      deliveryService,
      producer,
      batchConsumer,
    });

    await expect(useCase.checkHealth()).rejects.toThrow();
    expect(deliveryService.checkHealth).toHaveBeenCalledTimes(1);
    expect(producer.checkHealth).toHaveBeenCalledTimes(1);
    expect(batchConsumer.checkHealth).toHaveBeenCalledTimes(1);
  });
});
