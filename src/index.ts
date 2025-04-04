import {
  notificationQueueS,
  notificationQueueD,
} from "./models/firebird/firebird";
import { notify } from "./models/bitrix/bitrix";
import Notification from "./interfaces/Notification";
import { log } from "./models/log/log";
import { LogLevel } from "./enum/LogLevel";

const getNotifications = async (): Promise<Notification[]> => {
  return notificationQueueS();
};

const deleteNotification = async (id: number): Promise<void> => {
  await notificationQueueD(id);
};

const sendToBitrix = async (
  contact: number,
  message: string,
): Promise<void> => {
  let lastError;
  const maxAttempts = 3;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      await notify(contact, message);
      return;
    } catch (error) {
      lastError = error;
      if (attempt < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, attempt * 1000));
      }
    }
  }

  throw lastError;
};

const sendNotification = async (notification: Notification): Promise<void> => {
  const {
    message,
    client: { contacts },
  } = notification;

  if (!contacts.bitrix && !contacts.email) {
    throw new Error("Нет доступных каналов для отправки уведомления");
  }

  if (contacts.bitrix) {
    try {
      await sendToBitrix(contacts.bitrix, message);
      return;
    } catch (error) {
      await logNotification(
        LogLevel.Warning,
        "Не удалось отправить уведомелние через Bitrix",
        notification,
        error,
      );
    }
  }

  throw new Error("Не удалось отправить уведомление");
};

const logNotification = async (
  level: LogLevel,
  message: string,
  notification: Notification,
  error?: any,
): Promise<void> => {
  await log(level, message, {
    payload: notification,
    ...(error && { error }),
  });
};

const processNotifications = async (): Promise<never> => {
  try {
    const notifications = await getNotifications();
    for (const notification of notifications) {
      try {
        const {
          message,
          client: { contacts },
        } = notification;
        await sendNotification(notification);
        await logNotification(
          LogLevel.Info,
          "Уведомление успешно отправлено",
          notification,
        );
      } catch (error) {
        await logNotification(
          LogLevel.Error,
          "Ошибка при отправке уведомления",
          notification,
          error,
        );
      }
      await deleteNotification(notification.id);
    }
  } catch (error) {
    await logNotification(
      LogLevel.Critical,
      "Критическая ошибка при обработке уведомлений",
      null,
      error,
    );
    process.exit(1);
  } finally {
    process.exit(0);
  }
};

(async () => {
  await processNotifications();
})();
