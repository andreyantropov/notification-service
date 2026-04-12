import { type Channel } from "../../../../ports/index.js";
import { type Contact } from "../../../../types/index.js";

export interface Attempt {
  channel: Channel;
  contact: Contact;
}
