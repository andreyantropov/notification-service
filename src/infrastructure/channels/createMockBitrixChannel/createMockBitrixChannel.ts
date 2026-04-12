import { type Channel } from "../../../domain/ports/index.js";
import {
  CHANNEL_TYPE,
  type Contact,
  isContactOfType,
} from "../../../domain/types/index.js";

export const createMockBitrixChannel = (): Channel => {
  const type = CHANNEL_TYPE.BITRIX;

  const isSupports = (
    contact: Contact,
  ): contact is Extract<Contact, { type: typeof CHANNEL_TYPE.BITRIX }> => {
    return isContactOfType(contact, type);
  };

  const send = async (contact: Contact, message: string): Promise<void> => {
    if (!isSupports(contact)) {
      throw new Error(
        `Неверный тип получателя: ожидается id пользователя Bitrix, получено "${contact.type}"`,
      );
    }

    await new Promise((resolve) => setTimeout(resolve, 50));
    console.log(`[MOCK BITRIX] To: ${contact.value} | Message: ${message}`);
  };

  return {
    type,
    isSupports,
    send,
  };
};
