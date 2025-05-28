export interface Contacts {
  bitrix?: number;
  email?: string;
}

export interface Client {
  id: number;
  lastName: string;
  firstName: string;
  secondName: string;
  contacts?: Contacts;
}

export interface Notification {
  id: number;
  message: string;
  createdAt: Date;
  client: Client;
}
