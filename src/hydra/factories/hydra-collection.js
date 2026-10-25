import { setPrefixed } from './hydra-prefix.js';

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

  set totalItems(totalItems) {
    setPrefixed(this, 'totalItems', totalItems);
  }

  get member() {
    return this['hydra:member'];
  }

  set member(member) {
    setPrefixed(this, 'member', member);
  }

  get view() {
    return this['hydra:view'];
  }

  set view(view) {
    setPrefixed(this, 'view', view);
  }

  get search() {
    return this['hydra:search'];
  }

  set search(search) {
    setPrefixed(this, 'search', search);
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
