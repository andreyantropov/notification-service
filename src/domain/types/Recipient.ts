export type Recipient =
  | { type: "email"; value: string }
  | { type: "bitrix"; value: number };

export function isEmailRecipient(
  recipient: Recipient,
): recipient is { type: "email"; value: string } {
  return recipient.type === "email";
}

export function isBitrixRecipient(
  recipient: Recipient,
): recipient is { type: "bitrix"; value: number } {
  return recipient.type === "bitrix";
}
