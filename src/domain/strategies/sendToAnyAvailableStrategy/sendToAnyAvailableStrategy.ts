import { type Channel } from "../../ports/index.js";
import { type Notification, type Strategy } from "../../types/index.js";
import { getAttempts } from "../utils/index.js";

export const sendToAnyAvailableStrategy: Strategy = async (
  notification: Notification,
  channels: readonly Channel[],
): Promise<void> => {
  const { contacts, message } = notification;

  const attempts = getAttempts(contacts, channels);

  const results = await Promise.allSettled(
    attempts.map(({ channel, contact }) => channel.send(contact, message)),
  );

  const hasSuccess = results.some((result) => result.status === "fulfilled");

  if (!hasSuccess) {
    throw new Error(
      `Все попытки отправки уведомления (${attempts.length} шт.) завершились неудачей`,
    );
  }
};
