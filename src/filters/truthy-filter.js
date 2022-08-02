import Filter from './filter.js';

export class TruthyFilter extends Filter {
  value;

  constructor(value = null) {
    super();
    this.value = value;
  }

  normalize() {
    if (null == this.value) {
      return null;
    }

    return this.value ? 'true' : 'false';
  }

  async denormalize(input) {
    if (null == input) {
      this.value = null;

      return;
    }

    input = `${input}`.trim();

    this.value = ['true', 'on', 'yes', '1'].includes(input.toLowerCase());
  }
}
