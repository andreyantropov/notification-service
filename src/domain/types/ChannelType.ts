export const CHANNEL_TYPE = {
  BITRIX: "bitrix",
  EMAIL: "email",
} as const;

export type ChannelType = (typeof CHANNEL_TYPE)[keyof typeof CHANNEL_TYPE];
