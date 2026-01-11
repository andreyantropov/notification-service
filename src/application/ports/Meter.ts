export interface Meter {
  increment: (name: string, labels?: Record<string, string>) => void;
  record: (name: string, value: number, labels?: Record<string, string>) => void;
}