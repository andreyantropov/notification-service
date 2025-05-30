import Firebird, { Options, SvcMgrOptions } from "node-firebird";
import { Notification } from "../../../domain/interfaces/Notification";
import { RawNotification } from "./interfaces/RawNotification";
import { FirebirdSourceConfig } from "./interfaces/FirebirdSourceConfig";
import { NotificationSource } from "../../../domain/interfaces/NotificationSource";
import { mapRawNotificationToNotification } from "./mappers/notificationMapper";

export const createFirebirdSource = (
  config: FirebirdSourceConfig,
): NotificationSource => {
  const attachAsync = (
    options: Options | SvcMgrOptions,
  ): Promise<Firebird.Database> => {
    return new Promise((resolve, reject) => {
      Firebird.attach(options, (err, db) => {
        if (err) {
          return reject(err);
        }
        resolve(db);
      });
    });
  };

  const getNotifications = async (): Promise<Notification[]> => {
    let db: Firebird.Database | undefined;
    try {
      db = await attachAsync(config);
      return await new Promise<Notification[]>((resolve, reject) => {
        if (!db) {
          throw new Error("Не удалось установить соединение с БД");
        }

        db.query(
          "SELECT ID, MESSAGE, CREATED_AT, EMPLOYEE_ID, EMPLOYEE_LAST_NAME, EMPLOYEE_FIRST_NAME, EMPLOYEE_SECOND_NAME, BITRIX_ID, EMAIL FROM NOTIFICATION_QUEUE_S",
          [],
          (err: Error, result: RawNotification[]) => {
            if (err) {
              reject(err);
            } else {
              resolve(result.map(mapRawNotificationToNotification));
            }
          },
        );
      });
    } catch (error) {
      throw new Error("Не удалось получить список уведомлений из БД", {
        cause: error,
      });
    } finally {
      if (db) {
        db.detach();
      }
    }
  };

  const deleteNotification = async (id: number): Promise<number> => {
    let db: Firebird.Database | undefined;
    try {
      db = await attachAsync(config);
      return await new Promise<number>((resolve, reject) => {
        if (!db) {
          throw new Error("Не удалось установить соединение с БД");
        }

        db.query(
          "SELECT RESULT FROM NOTIFICATION_QUEUE_D(?)",
          [id],
          (err: Error, result: { result: number }[]) => {
            if (err) {
              reject(err);
            } else {
              resolve(result[0].result);
            }
          },
        );
      });
    } catch (error) {
      throw new Error("Не удалось удалить уведомление из БД", { cause: error });
    } finally {
      if (db) {
        db.detach();
      }
    }
  };

  return {
    getNotifications,
    deleteNotification,
  };
};
