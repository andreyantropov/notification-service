export type Contact =
  | { type: "email"; value: string }
  | { type: "bitrix"; value: number };

export function isEmailContact(
  contact: Contact,
): contact is { type: "email"; value: string } {
  return contact.type === "email";
}

export function isBitrixContact(
  contact: Contact,
): contact is { type: "bitrix"; value: number } {
  return contact.type === "bitrix";
}
