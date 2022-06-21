export function b64encode(text: string) {
  return Buffer.from(text, 'utf-8').toString('base64');
}

export function b64decode(text: string): string {
  return Buffer.from(text, 'base64').toString();
}
