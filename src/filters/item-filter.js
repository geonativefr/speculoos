import Filter from './filter.js';
import { getIri } from '../hydra/index.js';

function normalizeSingle(item) {
  if ('string' === typeof item) {
    return item;
  }
  try {
    return getIri(item);
  } catch (e) {
    return null;
  }
}

function normalizeMultiple(items) {
  return items.map(item => normalizeSingle(item));
}

async function denormalizeSingle(item, store) {
  try {
    return await store.getItem(item);
  } catch (e) {
    return null;
  }
}

async function denormalizeMultiple(items, store) {
  return Promise.all(items.map(item => denormalizeSingle(item, store)));
}

export class ItemFilter extends Filter {
  items = [];
  multiple;
  constructor(items, multiple = false) {
    super();
    this.items = Array.isArray(items) ? items : [items];
    this.multiple = multiple;
  }

  get item() {
    return this.items[0] ?? null;
  }

  set item(item) {
    this.items = [item];
    this.multiple = false;
  }

  normalize() {
    return (this.multiple || this.items.length > 1) ? normalizeMultiple(this.items) : normalizeSingle(this.item);
  }

  static async denormalize(input, {store, multiple}) {
    if (Array.isArray(input)) {
      return new this(await denormalizeMultiple(input), multiple ?? true);
    }

    return new this([await denormalizeSingle(input, store)], multiple ?? false);
  }
}
