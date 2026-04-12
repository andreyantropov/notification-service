import { beforeEach, describe, expect, it, vi } from "vitest";

import { type Channel } from "../../../domain/ports/index.js";
import { resolveStrategy } from "../../../domain/strategies/index.js";
import {
  type Notification,
  STRATEGY_TYPE,
} from "../../../domain/types/index.js";

import { createDeliveryService } from "./createDeliveryService.js";

vi.mock("../../../domain/strategies/index.js", () => ({
  resolveStrategy: vi.fn(),
}));

describe("createDeliveryService", () => {
  const mockChannel = { id: "ch1" } as unknown as Channel;

  const mockNotification = {
    id: "1",
    message: "hello",
    strategy: STRATEGY_TYPE.SEND_TO_ALL_AVAILABLE,
    contacts: [],
    createdAt: new Date().toISOString(),
    initiator: { id: "u1", name: "Admin" },
  } as Notification;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should throw an error if no channels are provided", () => {
    expect(() => createDeliveryService({ channels: [] })).toThrow(
      "В сервис не передано ни одного канала",
    );
  });

  it("should call resolveStrategy with strategy from notification", async () => {
    const mockHandler = vi.fn().mockResolvedValue(undefined);
    vi.mocked(resolveStrategy).mockReturnValue(mockHandler);

    const service = createDeliveryService({ channels: [mockChannel] });
    await service.deliver(mockNotification);

    expect(resolveStrategy).toHaveBeenCalledWith(mockNotification.strategy);
    expect(mockHandler).toHaveBeenCalledWith(mockNotification, [mockChannel]);
  });

  it("should propagate errors from the strategy handler", async () => {
    const error = new Error("Send failed");
    const mockHandler = vi.fn().mockRejectedValue(error);
    vi.mocked(resolveStrategy).mockReturnValue(mockHandler);

    const service = createDeliveryService({ channels: [mockChannel] });
    await expect(service.deliver(mockNotification)).rejects.toThrow(
      "Send failed",
    );
  });
});
