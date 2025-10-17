import { Contact } from "../../../../domain/types/Contact.js";

export interface Warning {
  message: string;
  details?: unknown;
  contact?: Contact;
  channel?: string;
}
