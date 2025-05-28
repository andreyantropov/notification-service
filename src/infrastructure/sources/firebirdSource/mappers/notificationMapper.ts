import { RawNotification } from "../interfaces/RawNotification";
import {
  Contacts,
  Notification,
} from "../../../../domain/interfaces/Notification";

export const mapRawNotificationToNotification = (
  raw: RawNotification,
): Notification => {
  const contacts: Contacts = {};

  if (raw.bitrix_id != null) {
    contacts.bitrix = raw.bitrix_id;
  }

  if (raw.email != null) {
    contacts.email = raw.email;
  }

  const result: Notification = {
    id: raw.id,
    message: raw.message,
    createdAt: raw.created_at,
    client: {
      id: raw.employee_id,
      lastName: raw.employee_last_name,
      firstName: raw.employee_first_name,
      secondName: raw.employee_second_name,
    },
  };

  if (Object.keys(contacts).length > 0) {
    result.client.contacts = contacts;
  }

  return result;
};
