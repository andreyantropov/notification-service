export interface RawNotification {
  id: number;
  message: string;
  created_at: Date;
  employee_id: number;
  employee_last_name: string;
  employee_first_name: string;
  employee_second_name: string;
  bitrix_id?: number;
  email?: string;
}
