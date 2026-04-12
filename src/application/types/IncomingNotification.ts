import { type Notification } from "../../domain/types/index.js";

export type IncomingNotification = Omit<
  Notification,
  "createdAt" | "id" | "initiator" | "strategy"
> & {
  readonly strategy?: Notification["strategy"];
};
