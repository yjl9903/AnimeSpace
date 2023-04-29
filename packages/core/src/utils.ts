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
