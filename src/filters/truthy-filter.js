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

  async denormalize(input) {
    if (null == input) {
      this.value = false;

      return;
    }

    input = `${input}`.trim();

    this.value = ['true', 'on', 'yes', '1'].includes(input.toLowerCase());
  }
}
