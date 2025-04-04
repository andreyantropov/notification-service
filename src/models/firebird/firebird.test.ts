import Firebird from "node-firebird";
import { notificationQueueS, notificationQueueD } from "./firebird";
import RawNotification from "../../interfaces/RawNotification";

jest.mock("node-firebird");

const mockAttach = jest.fn();
const mockQuery = jest.fn();
const mockDetach = jest.fn();

jest.mock("../../../firebird.config", () => ({
  host: "localhost",
  port: 3050,
  database: "test.fdb",
  user: "sysdba",
  password: "masterkey",
}));

describe("Firebird Database Functions", () => {
  let mockDb: Partial<Firebird.Database>;

  beforeEach(() => {
    mockDb = {
      query: mockQuery,
      detach: mockDetach,
    };

    mockAttach.mockImplementation((options, callback) => {
      callback(null, mockDb);
    });

    (Firebird.attach as jest.Mock) = mockAttach;
    (Firebird as any).attach = mockAttach;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("attachAsync", () => {
    it("should resolve with db on successful connection", async () => {
      const db = await new Promise((resolve, reject) => {
        Firebird.attach({}, (err, db) => {
          if (err) reject(err);
          else resolve(db);
        });
      });

      expect(db).toBe(mockDb);
      expect(mockAttach).toHaveBeenCalled();
    });

    it("should reject with error on connection failure", async () => {
      const testError = new Error("Connection failed");
      mockAttach.mockImplementationOnce((options, callback) => {
        process.nextTick(() => callback(testError, null));
      });

      await expect(
        new Promise((resolve, reject) => {
          Firebird.attach({}, (err, db) => {
            if (err) reject(err);
            else resolve(db);
          });
        }),
      ).rejects.toThrow(testError);
    });
  });

  describe("notificationQueueS", () => {
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

      const result = await notificationQueueS();

      expect(mockAttach).toHaveBeenCalledTimes(1);
      expect(mockQuery).toHaveBeenCalledWith(
        "SELECT * FROM NOTIFICATION_QUEUE_S",
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

    it("should handle database errors", async () => {
      const testError = new Error("Database error");
      mockQuery.mockImplementation((query, params, callback) => {
        callback(testError, null);
      });

      await expect(notificationQueueS()).rejects.toThrow(testError);
      expect(mockDetach).toHaveBeenCalledTimes(1);
    });

    it("should handle connection errors", async () => {
      const testError = new Error("Connection failed");
      mockAttach.mockImplementation((options, callback) => {
        callback(testError, null);
      });

      await expect(notificationQueueS()).rejects.toThrow(testError);
      expect(mockDetach).not.toHaveBeenCalled();
    });
  });

  describe("notificationQueueD", () => {
    it("should return result for valid id", async () => {
      const testId = 1;
      const expectedResult = 1;

      mockQuery.mockImplementation((query, params, callback) => {
        callback(null, [{ result: expectedResult }]);
      });

      const result = await notificationQueueD(testId);

      expect(mockAttach).toHaveBeenCalledTimes(1);
      expect(mockQuery).toHaveBeenCalledWith(
        "SELECT * FROM NOTIFICATION_QUEUE_D(?)",
        [testId],
        expect.any(Function),
      );
      expect(mockDetach).toHaveBeenCalledTimes(1);
      expect(result).toBe(expectedResult);
    });

    it("should handle empty result set", async () => {
      const testId = 1;
      const expectedResult = 0;

      mockQuery.mockImplementation((query, params, callback) => {
        callback(null, [{ result: expectedResult }]);
      });

      const result = await notificationQueueD(testId);

      expect(mockAttach).toHaveBeenCalledTimes(1);
      expect(mockQuery).toHaveBeenCalledWith(
        "SELECT * FROM NOTIFICATION_QUEUE_D(?)",
        [testId],
        expect.any(Function),
      );
      expect(mockDetach).toHaveBeenCalledTimes(1);
      expect(result).toBe(expectedResult);
    });

    it("should handle database errors", async () => {
      const testId = 1;
      const testError = new Error("Database error");

      mockQuery.mockImplementation((query, params, callback) => {
        callback(testError, null);
      });

      await expect(notificationQueueD(testId)).rejects.toThrow(testError);
      expect(mockDetach).toHaveBeenCalledTimes(1);
    });

    it("should handle connection errors", async () => {
      const testId = 1;
      const testError = new Error("Connection failed");

      mockAttach.mockImplementation((options, callback) => {
        callback(testError, null);
      });

      await expect(notificationQueueD(testId)).rejects.toThrow(testError);
      expect(mockDetach).not.toHaveBeenCalled();
    });
  });
});
