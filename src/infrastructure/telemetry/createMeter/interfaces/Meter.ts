export interface Meter {
  readonly increment: (
    name: string,
    labels?: Record<string, boolean | number | string>,
  ) => void;
  readonly add: (
    name: string,
    value: number,
    labels?: Record<string, boolean | number | string>,
  ) => void;
  readonly record: (
    name: string,
    value: number,
    labels?: Record<string, boolean | number | string>,
  ) => void;
  readonly gauge: (
    name: string,
    value: number,
    labels?: Record<string, boolean | number | string>,
  ) => void;
}
