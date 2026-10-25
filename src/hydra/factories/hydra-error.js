import { setPrefixed } from './hydra-prefix.js';

export class HydraError extends Error {
  statusCode;

  get title() {
    return this['hydra:title'];
  }

  set title(title) {
    setPrefixed(this, 'title', title);
  }

  get description() {
    return this['hydra:description'];
  }

  set description(description) {
    setPrefixed(this, 'description', description);
  }
}
