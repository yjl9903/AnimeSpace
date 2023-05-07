export function formatStringArray(arr: string | string[] | undefined | null) {
  if (arr !== undefined && arr !== null) {
    if (Array.isArray(arr)) {
      return arr;
    } else {
      return [arr];
    }
  }
  return [];
}

export function formatTitle(template: string, data: Record<string, string>) {
  for (const [key, value] of Object.entries(data)) {
    template = template.replace(new RegExp(`{${key}}`, 'g'), value);
  }
  return template;
}
