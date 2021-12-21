export class HydraError extends Error {
  statusCode;

  get title() {
    return this['hydra:title'];
  }

  get description() {
    return this['hydra:description'];
  }
}
