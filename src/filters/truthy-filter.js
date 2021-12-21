import Filter from './filter.js';

export class TruthyFilter extends Filter {
  value;

  constructor(value = false) {
    super();
    this.value = value;
  }

  normalize() {
    return this.value ? 'true' : 'false';
  }

  static denormalize(input) {
    if ([undefined, null, ''].includes(input?.trim())) {
      return new this(false);
    }

    if ('boolean' === typeof input) {
      return new this(input);
    }

    return new this(['true', 'on', 'yes', '1'].includes(input?.trim()?.toLowerCase()));
  }
}
