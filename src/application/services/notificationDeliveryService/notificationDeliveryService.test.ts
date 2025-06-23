import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  createNotificationDeliveryService,
  NotificationDeliveryServiceConfig,
} from "./index.js";
import { NotificationDeliveryService } from "./interfaces/NotificationDeliveryService.js";
import { Recipient } from "../../../domain/types/Recipient.js";

const mockSend = vi.fn();
const mockIsSupports = vi.fn();

describe("createNotificationDeliveryService", () => {
  let service: NotificationDeliveryService;

  beforeEach(() => {
    const mockSender: {
      send: (recipient: Recipient, message: string) => Promise<void>;
      isSupports: (recipient: Recipient) => boolean;
    } = {
      send: mockSend,
      isSupports: mockIsSupports,
    };

    const config: NotificationDeliveryServiceConfig = {
      sender: mockSender,
    };

    service = createNotificationDeliveryService(config);
    mockSend.mockClear();
    mockIsSupports.mockClear();
  });

  it("should call sender.send when recipient is supported", async () => {
    const recipient: Recipient = {
      type: "email",
      value: "test@example.com",
    };

    mockIsSupports.mockReturnValue(true);
    mockSend.mockResolvedValue(undefined);

    await expect(
      service.send([recipient], "Test message"),
    ).resolves.not.toThrow();

    expect(mockIsSupports).toHaveBeenCalledWith(recipient);
    expect(mockSend).toHaveBeenCalledWith(recipient, "Test message");
  });

  it("should throw error if no recipient is provided", async () => {
    await expect(service.send([], "Test message")).rejects.toThrow(
      "Нет получателя для доставки уведомления",
    );
  });

  it("should throw error if none of the recipients are supported", async () => {
    const recipients: Recipient[] = [
      {
        type: "email",
        value: "test1@example.com",
      },
      {
        type: "bitrix",
        value: 123,
      },
    ];

    mockIsSupports.mockReturnValue(false);

    await expect(service.send(recipients, "Test message")).rejects.toThrow(
      "Не удалось отправить уведомление ни одним из доступных способов",
    );

    expect(mockIsSupports).toHaveBeenCalledTimes(recipients.length);
  });

  it("should return on first successful delivery", async () => {
    const recipients: Recipient[] = [
      {
        type: "email",
        value: "test1@example.com",
      },
      {
        type: "bitrix",
        value: 123,
      },
    ];

    mockIsSupports
      .mockImplementationOnce(() => true)
      .mockImplementationOnce(() => true);
    mockSend
      .mockImplementationOnce(() => Promise.reject(new Error("Send failed")))
      .mockImplementationOnce(() => Promise.resolve());

    await service.send(recipients, "Test message");

    expect(mockSend).toHaveBeenCalledTimes(2);
  });

  it("should not try next recipient after success", async () => {
    const recipients: Recipient[] = [
      {
        type: "email",
        value: "test1@example.com",
      },
      {
        type: "bitrix",
        value: 123,
      },
    ];

    mockIsSupports.mockReturnValue(true);
    mockSend.mockResolvedValueOnce(undefined);

    await service.send(recipients, "Test message");

    expect(mockSend).toHaveBeenCalledTimes(1);
  });

  it("should throw error if all deliveries fail", async () => {
    const recipients: Recipient[] = [
      {
        type: "email",
        value: "test1@example.com",
      },
      {
        type: "bitrix",
        value: 123,
      },
    ];

    mockIsSupports.mockReturnValue(true);
    mockSend.mockRejectedValue(new Error("Send failed"));

    await expect(service.send(recipients, "Test message")).rejects.toThrow(
      "Не удалось отправить уведомление ни одним из доступных способов",
    );

    expect(mockSend).toHaveBeenCalledTimes(recipients.length);
  });
});
