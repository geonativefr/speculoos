class Filter {
  normalize() {
    throw Error('This method is meant to be overriden.');
  }

  static denormalize(input) {
    throw Error('This method is meant to be overriden.');
  }
}

export default Filter;
