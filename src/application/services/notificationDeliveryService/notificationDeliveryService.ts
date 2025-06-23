import { Recipient } from "../../../domain/types/Recipient.js";
import { NotificationDeliveryServiceConfig } from "./interfaces/NotificationDeliveryServiceConfig.js";
import { NotificationDeliveryService } from "./interfaces/NotificationDeliveryService.js";

export const createNotificationDeliveryService = ({
  sender,
}: NotificationDeliveryServiceConfig): NotificationDeliveryService => {
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

  const send = async (
    recipients: Recipient[],
    message: string,
  ): Promise<void> => {
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

  return { send };
};
