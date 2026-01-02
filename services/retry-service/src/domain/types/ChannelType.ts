import { CHANNEL_TYPES } from "../constants/index.js";

export type ChannelType = (typeof CHANNEL_TYPES)[keyof typeof CHANNEL_TYPES];
