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

  static denormalize(input) {

    if ('string' === typeof input) {
      input = input.trim();
    }

    if ([undefined, null, ''].includes(input)) {
      return new this([]);
    }

    if (!Array.isArray(input)) {
      input = [input];
    }

    return new this(input);
  }
}
