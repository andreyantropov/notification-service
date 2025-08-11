import { Recipient } from "../../../domain/types/Recipient.js";
import { NotificationDeliveryService } from "./interfaces/NotificationDeliveryService.js";
import { Notification } from "../../../domain/interfaces/Notification.js";
import { NotificationSender } from "../../../domain/interfaces/NotificationSender.js";

export const createNotificationDeliveryService = (
  sender: NotificationSender,
): NotificationDeliveryService => {
  const sendToRecipient = async (
    recipient: Recipient,
    message: string,
  ): Promise<boolean> => {
    if (!sender.isSupports(recipient)) {
      return false;
    }

    try {
      await sender.send(recipient, message);
      return true;
    } catch {
      return false;
    }
  };

  const send = async ({ recipients, message }: Notification): Promise<void> => {
    if (!recipients || recipients.length === 0) {
      throw new Error("Нет получателя для доставки уведомления");
    }

    for (const recipient of recipients) {
      const success = await sendToRecipient(recipient, message);
      if (success) return;
    }

    throw new Error(
      "Не удалось отправить уведомление ни одним из доступных способов",
    );
  };

  const checkHealth = sender.checkHealth
    ? async (): Promise<void> => {
        await sender.checkHealth?.();
      }
    : undefined;

  return {
    send,
    ...(checkHealth ? { checkHealth } : {}),
  };
};
