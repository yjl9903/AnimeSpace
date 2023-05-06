export class AnimeSystemError extends Error {
  public readonly detail: string;

  constructor(detail: string) {
    super(detail);
    this.detail = detail;
  }
}
