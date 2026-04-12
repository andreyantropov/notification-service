import { type Channel } from "../../ports/index.js";
import { type Notification, type Strategy } from "../../types/index.js";
import { getAttempts } from "../utils/index.js";

export const sendToAllAvailableStrategy: Strategy = async (
  notification: Notification,
  channels: readonly Channel[],
): Promise<void> => {
  const { contacts, message } = notification;

  const attempts = getAttempts(contacts, channels);

  await Promise.all(
    attempts.map(({ channel, contact }) => channel.send(contact, message)),
  );
};
