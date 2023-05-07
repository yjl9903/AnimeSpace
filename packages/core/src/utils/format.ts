import { z } from 'zod';

export const StringArray = z.union([
  z.string().transform((s) => [s]),
  z.array(z.string()),
  z.null().transform(() => [])
]);

export function formatStringArray(arr: string | string[] | undefined | null) {
  const parsed = StringArray.safeParse(arr);
  if (parsed.success) {
    return parsed.data;
  } else {
    return [];
  }
}

export function formatTitle(template: string, data: Record<string, string>) {
  for (const [key, value] of Object.entries(data)) {
    template = template.replace(new RegExp(`{${key}}`, 'g'), value);
  }
  return template;
}
