import { Notification } from "../../../../../../domain/types/Notification.js";

const EMPTY_MESSAGE = "";

export const validateNotification = (notification: Notification): boolean => {
  const { recipients, message } = notification;

  if (!recipients || recipients.length === 0) {
    return false;
  }

  if (message === EMPTY_MESSAGE) {
    return false;
  }

  return true;
};
