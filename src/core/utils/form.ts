// DynamicForm builds its fields at runtime, so it hands back Record<string, unknown>. These narrow
// a field to what the call site knows it is, in one place instead of a cast per property.

export const asText = (value: unknown): string =>
  value == null ? '' : String(value);

// Empty string means "left blank", which the API models as null rather than "".
export const asOptionalText = (value: unknown): string | null => {
  const text = asText(value).trim();
  return text === '' ? null : text;
};

export const asOptionalNumber = (value: unknown): number | null => {
  const text = asText(value).trim();
  if (text === '') return null;
  const parsed = Number(text);
  return Number.isFinite(parsed) ? parsed : null;
};
