export class AnimeSystemError extends Error {
  public readonly detail: string;

  constructor(detail: string) {
    super();
    this.detail = detail;
  }
}
