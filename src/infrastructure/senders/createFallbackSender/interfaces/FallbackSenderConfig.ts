import { Recipient } from "../../../../domain/types/Recipient.js";

export interface FallbackSenderConfig {
  onError?: (
    payload: { recipient: Recipient; message: string },
    error: Error,
  ) => void;
  onHealthCheckError?: (senderName: string, error: Error) => void;
}
