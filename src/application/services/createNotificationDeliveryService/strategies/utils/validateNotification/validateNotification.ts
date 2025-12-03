import { Notification } from "../../../../../../domain/types/index.js";

const EMPTY_MESSAGE = "";

export const validateNotification = (notification: Notification): boolean => {
  const { contacts, message } = notification;

  if (!contacts || contacts.length === 0) {
    return false;
  }

  if (message === EMPTY_MESSAGE) {
    return false;
  }

  return true;
};
