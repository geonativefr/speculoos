import Filter from './filter.js';

export class ArrayFilter extends Filter {
  values;

  constructor(values = []) {
    super();
    this.values = values;
  }

  normalize() {
    return this.values;
  }

  async denormalize(input) {

    if ('string' === typeof input) {
      input = input.trim();
    }

    if ([undefined, null, ''].includes(input)) {
      this.values = [];

      return;
    }

    if (!Array.isArray(input)) {
      input = [input];
    }

    this.values = input;
  }
}
