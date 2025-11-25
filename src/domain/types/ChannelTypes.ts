export const CHANNEL_TYPES = {
  BITRIX: "bitrix",
  EMAIL: "email",
} as const;

export type ChannelTypes = (typeof CHANNEL_TYPES)[keyof typeof CHANNEL_TYPES];
