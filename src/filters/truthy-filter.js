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
    if (null == input) {
      return new this(false);
    }

    input = `${input}`.trim();

    return new this(['true', 'on', 'yes', '1'].includes(input.trim().toLowerCase()));
  }
}
