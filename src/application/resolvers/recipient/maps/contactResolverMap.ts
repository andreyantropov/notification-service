import { bitrixContactResolver } from "../bitrixContactResolver";
import { emailContactResolver } from "../emailContactResolver";
import { ContactResolverMap } from "../types/ContactResolverMap";

export const defaultContactResolverMap: ContactResolverMap = {
  bitrix: bitrixContactResolver,
  email: emailContactResolver,
};
