import axios from "axios";
import MockAdapter from "axios-mock-adapter";
import { notify } from "./bitrix";

jest.mock("dotenv/config", () => ({}));

describe("notify function", () => {
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

  it("should successfully send valid message to valid user", async () => {
    const userId = Number(process.env.BITRIX_USER_ID);
    const message = "Тест сервиса уведомлений ISPlanar";

    mockAxios.onPost(/im.notify.personal.add.json/).reply(200, {
      result: "1",
    });

    const result = await notify(userId, message);

    expect(result.result).toBe("1");
    expect(mockAxios.history.post.length).toBe(1);
    expect(mockAxios.history.post[0].params).toEqual({
      user_id: userId,
      message: message,
    });
  });

  it("should throw error when userId is invalid", async () => {
    const invalidUserId = "id";
    const message = "Тест сервиса уведомлений ISPlanar";

    mockAxios.onPost(/im.notify.personal.add.json/).reply(400, {
      error: "Invalid user_id",
    });

    await expect(notify(invalidUserId as any, message)).rejects.toThrow();
  });

  it("should throw error when message is empty", async () => {
    const userId = Number(process.env.BITRIX_USER_ID);
    const emptyMessage = "";

    mockAxios.onPost(/im.notify.personal.add.json/).reply(400, {
      error: "Message cannot be empty",
    });

    await expect(notify(userId, emptyMessage)).rejects.toThrow();
  });
});
