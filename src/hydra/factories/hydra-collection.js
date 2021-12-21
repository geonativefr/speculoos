export class HydraCollection {
  constructor(data = {}) {
    Object.assign(
      this,
      {
        ...data,
        * [Symbol.iterator]() {
          yield* this['hydra:member'] || [];
        },
      }
    );
  }

  get length() {
    return this.items.length;
  }

  get totalItems() {
    return this['hydra:totalItems'] || 0;
  }

  get items() {
    return this['hydra:member'] || [];
  }

  forEach(callback) {
    return (this['hydra:member'] || []).forEach(callback);
  }

  map(callback) {
    return (this['hydra:member'] || []).map(callback);
  }

  filter(callback) {
    return (this['hydra:member'] || []).filter(callback);
  }

  find(callback) {
    return (this['hydra:member'] || []).find(callback);
  }

  findIndex(callback) {
    return (this['hydra:member'] || []).findIndex(callback);
  }
}
