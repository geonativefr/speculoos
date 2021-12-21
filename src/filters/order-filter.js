import Filter from './filter.js';

const reverts = {
  asc: 'desc',
  desc: 'asc',
};

export class OrderFilter extends Filter {
  order;
  constructor(order = {}) {
    super();
    this.order = order;
  }

  revert() {
    const order = {};
    for (const key in this.order) {
      const value = this.order[key];
      order[key] = reverts[value] ?? value;
    }

    this.order = order;
    return this;
  }

  normalize() {
    return this.order;
  }

  static denormalize(input) {
    if ('object' === typeof input && null != input) {
      return new this(input);
    }

    return new this();
  }
}
