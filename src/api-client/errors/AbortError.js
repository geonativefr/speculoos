export class AbortError extends Error {
  constructor(reason) {
    super();
    this.name = 'AbortError';
    this.reason = reason;
  }
}
