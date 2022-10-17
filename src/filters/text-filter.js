import Filter from './filter.js';

export class TextFilter extends Filter {
  _value;

  constructor(value = null) {
    super();
    this.value = value;
  }

  get value() {
    return this._value;
  }

  set value(value) {
    this._value = !value ? value : value.toString();
  }

  normalize() {
    if ([undefined, null, ''].includes(this.value?.trim())) {
      return null;
    }

    return this.value.trim();
  }

  async denormalize(input) {

    if ('string' === typeof input) {
      input = input.trim();
    }

    if ([undefined, null, ''].includes(input)) {
      this.value = null;

      return;
    }

    this.value = input;
  }
}
