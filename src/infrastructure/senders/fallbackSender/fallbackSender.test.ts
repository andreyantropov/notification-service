import { Recipient } from "../../../domain/types/Recipient";
import { NotificationSender } from "../../../domain/interfaces/NotificationSender";
import { createFallbackSender } from "./fallbackSender";

type MockedSender = jest.Mocked<NotificationSender>;
type FallbackSenderConfig = {
  senders: NotificationSender[];
  onError?: (
    payload: { recipient: Recipient; message: string },
    error: Error,
  ) => void;
};

describe("createFallbackSender", () => {
  const mockRecipient: Recipient = { type: "email", value: "user@example.com" };
  const mockMessage = "Тестовое уведомление";

  let onErrorMock: jest.Mock;

  beforeEach(() => {
    onErrorMock = jest.fn();
  });

  it("should throw an error if no senders are provided", () => {
    expect(() =>
      createFallbackSender({ senders: [] } as FallbackSenderConfig),
    ).toThrowError("Не передано ни одного сендера");
  });

  it("should return true in isSupports if at least one sender supports the recipient", () => {
    const sender1: MockedSender = {
      isSupports: jest.fn().mockReturnValue(false),
      send: jest.fn(),
    };
    const sender2: MockedSender = {
      isSupports: jest.fn().mockReturnValue(true),
      send: jest.fn(),
    };

    const fallbackClient = createFallbackSender({
      senders: [sender1, sender2],
      onError: onErrorMock,
    });

    expect(fallbackClient.isSupports(mockRecipient)).toBe(true);
    expect(sender1.isSupports).toHaveBeenCalledWith(mockRecipient);
    expect(sender2.isSupports).toHaveBeenCalledWith(mockRecipient);
  });

  it("should return false in isSupports if none of the senders support the recipient", () => {
    const sender1: MockedSender = {
      isSupports: jest.fn().mockReturnValue(false),
      send: jest.fn(),
    };
    const sender2: MockedSender = {
      isSupports: jest.fn().mockReturnValue(false),
      send: jest.fn(),
    };

    const fallbackClient = createFallbackSender({
      senders: [sender1, sender2],
      onError: onErrorMock,
    });

    expect(fallbackClient.isSupports(mockRecipient)).toBe(false);
  });

  it("should successfully send using the first compatible sender", async () => {
    const sender1: MockedSender = {
      isSupports: jest.fn().mockReturnValue(true),
      send: jest.fn().mockResolvedValue(undefined),
    };
    const sender2: MockedSender = {
      isSupports: jest.fn().mockReturnValue(true),
      send: jest.fn(),
    };

    const fallbackClient = createFallbackSender({
      senders: [sender1, sender2],
      onError: onErrorMock,
    });

    await fallbackClient.send(mockRecipient, mockMessage);

    expect(sender1.send).toHaveBeenCalledWith(mockRecipient, mockMessage);
    expect(sender2.send).not.toHaveBeenCalled();
  });

  it("should try next sender if the first one fails", async () => {
    const sender1: MockedSender = {
      isSupports: jest.fn().mockReturnValue(true),
      send: jest.fn().mockRejectedValue(new Error("Ошибка доставки")),
    };
    const sender2: MockedSender = {
      isSupports: jest.fn().mockReturnValue(true),
      send: jest.fn().mockResolvedValue(undefined),
    };

    const fallbackClient = createFallbackSender({
      senders: [sender1, sender2],
      onError: onErrorMock,
    });

    await fallbackClient.send(mockRecipient, mockMessage);

    expect(sender1.send).toHaveBeenCalled();
    expect(sender2.send).toHaveBeenCalled();
  });

  it("should call onError when sending fails", async () => {
    const error = new Error("Ошибка отправки уведомления через канал Object");

    const sender: MockedSender = {
      isSupports: jest.fn().mockReturnValue(true),
      send: jest.fn().mockRejectedValue(error),
    };

    const fallbackClient = createFallbackSender({
      senders: [sender],
      onError: onErrorMock,
    });

    await expect(
      fallbackClient.send(mockRecipient, mockMessage),
    ).rejects.toThrowError(
      "Не удалось отправить сообщение ни одним из доступных сендеров",
    );

    expect(onErrorMock).toHaveBeenCalledWith(
      {
        recipient: mockRecipient,
        message: mockMessage,
      },
      error,
    );
  });
});
