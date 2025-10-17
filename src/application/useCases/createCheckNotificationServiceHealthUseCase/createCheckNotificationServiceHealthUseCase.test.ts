import { describe, it, expect, vi, beforeEach } from "vitest";

import { createCheckNotificationServiceHealthUseCase } from "./createCheckNotificationServiceHealthUseCase.js";
import { NotificationDeliveryService } from "../../services/createNotificationDeliveryService/index.js";

describe("CheckNotificationServiceHealthUseCase", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should call checkHealth when it is implemented by notificationDeliveryService", async () => {
    const checkHealthMock = vi.fn().mockResolvedValue(undefined);
    const notificationDeliveryService: NotificationDeliveryService = {
      send: vi.fn(),
      checkHealth: checkHealthMock,
    };

    const useCase = createCheckNotificationServiceHealthUseCase({
      notificationDeliveryService,
    });

    await useCase.checkHealth();

    expect(checkHealthMock).toHaveBeenCalledTimes(1);
  });

  it("should do nothing (and not throw) when checkHealth is not implemented", async () => {
    const notificationDeliveryService: NotificationDeliveryService = {
      send: vi.fn(),
    };

    const useCase = createCheckNotificationServiceHealthUseCase({
      notificationDeliveryService,
    });

    await expect(useCase.checkHealth()).resolves.toBeUndefined();
  });

  it("should propagate errors thrown by checkHealth implementation", async () => {
    const errorMessage = "Delivery service is unreachable";
    const checkHealthMock = vi.fn().mockRejectedValue(new Error(errorMessage));
    const notificationDeliveryService: NotificationDeliveryService = {
      send: vi.fn(),
      checkHealth: checkHealthMock,
    };

    const useCase = createCheckNotificationServiceHealthUseCase({
      notificationDeliveryService,
    });

    await expect(useCase.checkHealth()).rejects.toThrow(errorMessage);
    expect(checkHealthMock).toHaveBeenCalledTimes(1);
  });
});
