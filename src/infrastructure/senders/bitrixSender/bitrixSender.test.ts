import axios from "axios";
import MockAdapter from "axios-mock-adapter";
import { createBitrixSender } from "./bitrixSender";
import { NotificationSender } from "../../../domain/interfaces/NotificationSender";
import { Recipient } from "../../../domain/types/Recipient";
import { BitrixSenderConfig } from "./interfaces/BitrixSenderConfig";

jest.mock("dotenv/config");

describe("BitrixSender", () => {
  let mockAxios: MockAdapter;
  const originalEnv = process.env;

  beforeAll(() => {
    mockAxios = new MockAdapter(axios);
  });

  afterEach(() => {
    mockAxios.reset();
  });

  afterAll(() => {
    mockAxios.restore();
    process.env = originalEnv;
  });

  const setupEnv = () => {
    process.env = {
      ...originalEnv,
      BITRIX_API_URL: "https://bitrix24.planarchel.ru/rest/123/auth_key ",
    };
  };

  const getValidConfig = (): BitrixSenderConfig => ({
    url: process.env.BITRIX_API_URL!,
  });

  const getValidRecipient = (): Recipient => ({
    type: "bitrix",
    value: 123,
  });

  const getInvalidRecipient = (): Recipient => ({
    type: "email",
    value: "test@example.com",
  });

  it("should successfully send message to valid Bitrix user", async () => {
    setupEnv();
    const config = getValidConfig();
    const sender: NotificationSender = createBitrixSender(config);
    const recipient = getValidRecipient();
    const message = "Тест сервиса уведомлений ISPlanar";

    mockAxios.onPost(/im.notify.personal.add.json/).reply(200, {
      result: "1",
    });

    const result = await sender.send(recipient, message);

    expect(result).toBeUndefined();
    expect(mockAxios.history.post.length).toBe(1);
    expect(mockAxios.history.post[0].params).toEqual({
      user_id: recipient.value,
      message,
    });
  });

  it("should throw error when recipient is not a bitrix type", async () => {
    setupEnv();
    const config = getValidConfig();
    const sender: NotificationSender = createBitrixSender(config);
    const recipient = getInvalidRecipient();
    const message = "Тест сервиса уведомлений ISPlanar";

    await expect(sender.send(recipient, message)).rejects.toThrow(
      "Неверный тип получателя",
    );
  });

  it("should throw error if API returns error", async () => {
    setupEnv();
    const config = getValidConfig();
    const sender: NotificationSender = createBitrixSender(config);
    const recipient = getValidRecipient();
    const message = "Тест сервиса уведомлений ISPlanar";

    mockAxios.onPost(/im.notify.personal.add.json/).reply(400, {
      error: "Failed to send notification",
    });

    await expect(sender.send(recipient, message)).rejects.toThrow(
      "Не удалось отправить уведомление в Bitrix",
    );
  });

  it("should throw error if network request fails", async () => {
    setupEnv();
    const config = getValidConfig();
    const sender: NotificationSender = createBitrixSender(config);
    const recipient = getValidRecipient();
    const message = "Тест сервиса уведомлений ISPlanar";

    mockAxios.onPost(/im.notify.personal.add.json/).networkError();

    await expect(sender.send(recipient, message)).rejects.toThrow(
      "Не удалось отправить уведомление в Bitrix",
    );
  });
});
