import type { Contact, ChannelType } from "@notification-platform/shared";

export interface Channel {
  readonly type: ChannelType;
  readonly isSupports: (contact: Contact) => boolean;
  readonly send: (contact: Contact, message: string) => Promise<void>;
  readonly checkHealth?: () => Promise<void>;
}
