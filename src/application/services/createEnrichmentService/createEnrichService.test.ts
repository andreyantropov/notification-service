import { describe, expect, it, vi } from "vitest";

import {
  CHANNEL_TYPE,
  type Initiator,
  STRATEGY_TYPE,
} from "../../../domain/types/index.js";
import { type IncomingNotification } from "../../types/index.js";

import { DEFAULT_DELIVERY_STRATEGY } from "./constants/index.js";
import { createEnrichmentService } from "./createEnrichService.js";
import { type EnrichmentServiceDependencies } from "./interfaces/index.js";

describe("EnrichService", () => {
  const mockIdGenerator = {
    generateId: vi.fn().mockReturnValue("fixed-uuid-123"),
  };

  const dependencies: EnrichmentServiceDependencies = {
    idGenerator: mockIdGenerator,
  };

  const service = createEnrichmentService(dependencies);
  const mockInitiator: Initiator = { id: "user-1", name: "System Admin" };
  const mockIncoming: IncomingNotification = {
    message: "Welcome to the system",
    contacts: [{ type: CHANNEL_TYPE.EMAIL, value: "user@example.com" }],
  };

  it("should generate a notification with a unique ID from the generator", () => {
    const result = service.enrich(mockIncoming, mockInitiator);
    expect(mockIdGenerator.generateId).toHaveBeenCalled();
    expect(result.id).toBe("fixed-uuid-123");
  });

  it("should correctly map initiator and incoming data into the final notification", () => {
    const result = service.enrich(mockIncoming, mockInitiator);
    expect(result.initiator).toEqual(mockInitiator);
    expect(result.message).toBe(mockIncoming.message);
    expect(result.contacts).toEqual(mockIncoming.contacts);
  });

  it("should set a valid ISO string for createdAt field", () => {
    const result = service.enrich(mockIncoming, mockInitiator);
    expect(result.createdAt).toBeDefined();
    expect(new Date(result.createdAt).toISOString()).toBe(result.createdAt);
  });

  it("should use the strategy provided in the incoming notification", () => {
    const incomingWithStrategy: IncomingNotification = {
      ...mockIncoming,
      strategy: STRATEGY_TYPE.SEND_TO_ALL_AVAILABLE,
    };
    const result = service.enrich(incomingWithStrategy, mockInitiator);
    expect(result.strategy).toBe(STRATEGY_TYPE.SEND_TO_ALL_AVAILABLE);
  });

  it("should set DEFAULT_DELIVERY_STRATEGY if strategy is not provided", () => {
    const result = service.enrich(mockIncoming, mockInitiator);
    expect(result.strategy).toBe(DEFAULT_DELIVERY_STRATEGY);
  });
});
