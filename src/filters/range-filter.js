import Filter from './filter.js';

export class RangeFilter extends Filter {
  constructor(left, right, includeLeft = true, includeRight = true) {
    super();
    this.left = left;
    this.right = right;
    this.includeLeft = includeLeft;
    this.includeRight = includeRight;
  }

  normalize() {
    const output = {};
    if (null != this.left) {
      output[this.includeLeft ? 'gte' : 'gt'] = `${this.left}`;
    }
    if (null != this.right) {
      output[this.includeRight ? 'lte' : 'lt'] = `${this.right}`;
    }

    return Object.keys(output).length > 0 ? output : undefined;
  }

  async denormalize(input) {
    if (null == input || 'object' !== typeof input) {
      return;
    }

    if (Object.keys(input).includes('gt')) {
      this.left = parseFloat(input['gt']);
      this.includeLeft = false;
    }

    if (Object.keys(input).includes('gte')) {
      this.left = parseFloat(input['gte']);
      this.includeLeft = true;
    }

    if (Object.keys(input).includes('lt')) {
      this.right = parseFloat(input['lt']);
      this.includeRight = false;
    }

    if (Object.keys(input).includes('lte')) {
      this.right = parseFloat(input['lte']);
      this.includeRight = true;
    }
  }
}
