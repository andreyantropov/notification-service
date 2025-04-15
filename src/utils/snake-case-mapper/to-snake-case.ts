export const toSnakeCase = (key: string): string => {
  return key
    .replace(/(\s|-|\.)+/g, "_")
    .replace(/([a-z])([A-Z])/g, "$1_$2")
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1_$2")
    .toLowerCase()
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "");
};

export const mapKeysToSnakeCase = (obj: any): any => {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (
    obj instanceof Date ||
    obj instanceof RegExp ||
    obj instanceof Map ||
    obj instanceof Set
  ) {
    return obj;
  }

  if (typeof obj !== "object") {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => mapKeysToSnakeCase(item));
  }

  const result: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    result[toSnakeCase(key)] = mapKeysToSnakeCase(value);
  }
  return result;
};
