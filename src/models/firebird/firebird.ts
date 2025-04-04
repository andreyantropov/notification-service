import Firebird, { Options, SvcMgrOptions } from "node-firebird";
import options from "../../../firebird.config";
import Notification from "../../interfaces/Notification";
import RawNotification from "../../interfaces/RawNotification";

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

export const notificationQueueS = async (): Promise<Notification[]> => {
  const mapper = (rawNotification: RawNotification): Notification => {
    const contacts: { bitrix?: number } = {};

    if (rawNotification.bitrix_id != null) {
      contacts.bitrix = rawNotification.bitrix_id;
    }

    const result: Notification = {
      id: rawNotification.id,
      message: rawNotification.message,
      createdAt: rawNotification.created_at,
      client: {
        id: rawNotification.employee_id,
        lastName: rawNotification.employee_last_name,
        firstName: rawNotification.employee_first_name,
        secondName: rawNotification.employee_second_name,
      },
    };

    if (Object.keys(contacts).length > 0) {
      result.client.contacts = contacts;
    }

    return result;
  };

  const db = await attachAsync(options);

  return await new Promise<Notification[]>((resolve, reject) => {
    db.query(
      "SELECT * FROM NOTIFICATION_QUEUE_S",
      [],
      (err: Error, result: RawNotification[]) => {
        if (err) {
          reject(err);
        } else {
          resolve(result.map(mapper));
        }
        db.detach();
      },
    );
  });
};

export const notificationQueueD = async (id: number): Promise<number> => {
  const db = await attachAsync(options);

  return await new Promise<number>((resolve, reject) => {
    db.query(
      "SELECT * FROM NOTIFICATION_QUEUE_D(?)",
      [id],
      (err: Error, result: { result: number }[]) => {
        if (err) {
          reject(err);
        } else {
          resolve(result[0].result);
        }
        db.detach();
      },
    );
  });
};
