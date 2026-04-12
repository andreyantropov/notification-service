import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  type Initiator,
  type Notification,
} from "../../../domain/types/index.js";
import {
  type DeliveryService,
  type EnrichmentService,
} from "../../services/index.js";
import { type IncomingNotification } from "../../types/index.js";

import { createReceiveNotificationUseCase } from "./createReceiveNotificationUseCase.js";
import { type ReceiveNotificationUseCaseDependencies } from "./interfaces/index.js";

describe("ReceiveNotificationBatchUseCase", () => {
  const mockInitiator: Initiator = { id: "user-1", name: "System" };
  const mockIncoming: IncomingNotification = {
    contacts: [],
    message: "Hello",
  };
  const mockNotification: Notification = {
    ...mockIncoming,
    strategy: "send_to_first_available",
    id: "notif-1",
    createdAt: new Date().toISOString(),
    initiator: mockInitiator,
  };

  const mockEnrichmentService = {
    enrich: vi.fn(),
  };

  const mockDeliveryService = {
    deliver: vi.fn(),
  };

  const dependencies: ReceiveNotificationUseCaseDependencies = {
    enrichmentService: mockEnrichmentService as unknown as EnrichmentService,
    deliveryService: mockDeliveryService as unknown as DeliveryService,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("notify", () => {
    it("should enrich and deliver a single notification", async () => {
      mockEnrichmentService.enrich.mockReturnValue(mockNotification);
      mockDeliveryService.deliver.mockResolvedValue(undefined);

      const useCase = createReceiveNotificationUseCase(dependencies);
      const result = await useCase.execute(mockIncoming, mockInitiator);

      expect(mockEnrichmentService.enrich).toHaveBeenCalledWith(
        mockIncoming,
        mockInitiator,
      );
      expect(mockDeliveryService.deliver).toHaveBeenCalledWith(
        mockNotification,
      );
      expect(result).toEqual(mockNotification);
    });

    it("should propagate errors from delivery service", async () => {
      mockEnrichmentService.enrich.mockReturnValue(mockNotification);
      mockDeliveryService.deliver.mockRejectedValue(
        new Error("Delivery failed"),
      );

      const useCase = createReceiveNotificationUseCase(dependencies);

      await expect(
        useCase.execute(mockIncoming, mockInitiator),
      ).rejects.toThrow("Delivery failed");
    });
  });
});
