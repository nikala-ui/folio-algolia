export class AlgoliaIndexingError extends Error {
  readonly status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = "AlgoliaIndexingError";
    this.status = status;
  }
}
