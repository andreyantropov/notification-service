import { type Channel } from "../../ports/index.js";
import { type Notification, type Strategy } from "../../types/index.js";
import { getAttempts } from "../utils/index.js";

export const sendToFirstAvailableStrategy: Strategy = async (
  notification: Notification,
  channels: readonly Channel[],
): Promise<void> => {
  const { contacts, message } = notification;

  const attempts = getAttempts(contacts, channels);

  for (const { channel, contact } of attempts) {
    try {
      return await channel.send(contact, message);
    } catch {
      continue;
    }
  }

  throw new Error(
    `Все попытки отправки уведомления (${attempts.length} шт.) завершились неудачей`,
  );
};
