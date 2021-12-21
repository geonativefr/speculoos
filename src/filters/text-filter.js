import Filter from './filter.js';

export class TextFilter extends Filter {
  value;

  constructor(value = null) {
    super();
    this.value = value;
  }

  normalize() {
    if ([undefined, null, ''].includes(this.value?.trim())) {
      return null;
    }

    return this.value.trim();
  }

  static denormalize(input) {
    if ([undefined, null, ''].includes(input?.trim())) {
      return new this(null);
    }

    return new this(input.trim());
  }
}
