import Firebird, { Database, Options } from "node-firebird";
import { createFirebirdSource } from "./firebirdSource";
import { NotificationSource } from "../../../domain/interfaces/NotificationSource";
import { RawNotification } from "./interfaces/RawNotification";

jest.mock("node-firebird");

const mockAttach = jest.fn();
const mockQuery = jest.fn();
const mockDetach = jest.fn();

(Firebird.attach as jest.Mock) = mockAttach;

describe("FirebirdSource", () => {
  let mockDb: Partial<Database>;
  let notificationSource: NotificationSource;

  const config: Options = {
    host: "localhost",
    port: 3050,
    database: "test.fdb",
    user: "sysdba",
    password: "masterkey",
    lowercase_keys: true,
    pageSize: 4096,
    retryConnectionInterval: 1000,
    blobAsText: false,
    encoding: "UTF8",
    role: process.env.FIREBIRD_DB_ROLE,
  };

  beforeEach(() => {
    mockDb = {
      query: mockQuery,
      detach: mockDetach,
    };

    mockAttach.mockImplementation((options, callback) => {
      callback(null, mockDb as Database);
    });

    notificationSource = createFirebirdSource(config);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("getNotifications", () => {
    it("should return mapped notifications", async () => {
      const rawData: RawNotification[] = [
        {
          id: 1,
          message: "Test message",
          created_at: new Date("2025-01-01"),
          employee_id: 100,
          employee_last_name: "Doe",
          employee_first_name: "John",
          employee_second_name: "Smith",
          bitrix_id: 12345,
        },
        {
          id: 2,
          message: "Another message",
          created_at: new Date("2025-01-02"),
          employee_id: 101,
          employee_last_name: "Smith",
          employee_first_name: "Jane",
          employee_second_name: "Doe",
        },
      ];

      mockQuery.mockImplementation((query, params, callback) => {
        callback(null, rawData);
      });

      const result = await notificationSource.getNotifications();

      expect(mockAttach).toHaveBeenCalledTimes(1);
      expect(mockQuery).toHaveBeenCalledWith(
        "SELECT ID, MESSAGE, CREATED_AT, EMPLOYEE_ID, EMPLOYEE_LAST_NAME, EMPLOYEE_FIRST_NAME, EMPLOYEE_SECOND_NAME, BITRIX_ID, EMAIL FROM NOTIFICATION_QUEUE_S",
        [],
        expect.any(Function),
      );
      expect(mockDetach).toHaveBeenCalledTimes(1);

      expect(result).toEqual([
        {
          id: 1,
          message: "Test message",
          createdAt: new Date("2025-01-01"),
          client: {
            id: 100,
            lastName: "Doe",
            firstName: "John",
            secondName: "Smith",
            contacts: {
              bitrix: 12345,
            },
          },
        },
        {
          id: 2,
          message: "Another message",
          createdAt: new Date("2025-01-02"),
          client: {
            id: 101,
            lastName: "Smith",
            firstName: "Jane",
            secondName: "Doe",
          },
        },
      ]);
    });

    it("should throw error when database query fails", async () => {
      const testError = new Error("Database error");
      mockQuery.mockImplementation((query, params, callback) => {
        callback(testError, null);
      });

      await expect(notificationSource.getNotifications()).rejects.toThrowError(
        new Error("Не удалось получить список уведомлений из БД", {
          cause: testError,
        }),
      );

      expect(mockDetach).toHaveBeenCalledTimes(1);
    });

    it("should throw error on connection failure", async () => {
      const testError = new Error("Connection failed");
      mockAttach.mockImplementationOnce((options, callback) => {
        callback(testError, null);
      });

      const brokenClient = createFirebirdSource(config);

      await expect(brokenClient.getNotifications()).rejects.toThrowError(
        new Error("Не удалось получить список уведомлений из БД", {
          cause: testError,
        }),
      );

      expect(mockDetach).not.toHaveBeenCalled();
    });
  });

  describe("deleteNotification", () => {
    const testId = 1;
    const expectedResult = 1;

    it("should delete notification by ID", async () => {
      mockQuery.mockImplementation((query, params, callback) => {
        callback(null, [{ result: expectedResult }]);
      });

      await expect(
        notificationSource.deleteNotification(testId),
      ).resolves.not.toThrow();
      expect(mockAttach).toHaveBeenCalledTimes(1);
      expect(mockQuery).toHaveBeenCalledWith(
        "SELECT RESULT FROM NOTIFICATION_QUEUE_D(?)",
        [testId],
        expect.any(Function),
      );
      expect(mockDetach).toHaveBeenCalledTimes(1);
    });

    it("should handle empty result set", async () => {
      const emptyResult = 0;
      mockQuery.mockImplementation((query, params, callback) => {
        callback(null, [{ result: emptyResult }]);
      });

      const result = await notificationSource.deleteNotification(testId);

      expect(result).toBe(0);
      expect(mockQuery).toHaveBeenCalledWith(
        "SELECT RESULT FROM NOTIFICATION_QUEUE_D(?)",
        [testId],
        expect.any(Function),
      );
    });

    it("should throw error when query fails", async () => {
      const testError = new Error("Database error");
      mockQuery.mockImplementation((query, params, callback) => {
        callback(testError, null);
      });

      await expect(
        notificationSource.deleteNotification(testId),
      ).rejects.toThrowError(
        new Error("Не удалось удалить уведомление из БД", { cause: testError }),
      );

      expect(mockDetach).toHaveBeenCalledTimes(1);
    });

    it("should throw error on connection failure", async () => {
      const testError = new Error("Connection failed");
      mockAttach.mockImplementationOnce((options, callback) => {
        callback(testError, null);
      });

      const brokenClient = createFirebirdSource(config);

      await expect(
        brokenClient.deleteNotification(testId),
      ).rejects.toThrowError(
        new Error("Не удалось удалить уведомление из БД", { cause: testError }),
      );

      expect(mockDetach).not.toHaveBeenCalled();
    });
  });
});
