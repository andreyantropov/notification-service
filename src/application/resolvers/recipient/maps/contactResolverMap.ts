import { bitrixContactResolver } from "../bitrixContactResolver.js";
import { emailContactResolver } from "../emailContactResolver.js";
import { ContactResolverMap } from "../types/ContactResolverMap.js";

export const defaultContactResolverMap: ContactResolverMap = {
  bitrix: bitrixContactResolver,
  email: emailContactResolver,
};
