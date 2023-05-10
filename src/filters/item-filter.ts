import Filter from './filter';
import { getIri } from '../hydra';

interface HydraStore {
    getItem: (item: Item) => Item;
}

type Item = string | Object | null;

function normalizeSingle(item: Item): string | null {
    if ('string' === typeof item) {
        return item;
    }
    try {
        return getIri(item);
    } catch (e) {
        return null;
    }
}

function normalizeMultiple(items: Item[]): (string | null)[] {
    return items.map((item) => normalizeSingle(item));
}

async function denormalizeSingle(item: Item, store: HydraStore): Promise<Object | null> {
    try {
        return await store.getItem(item);
    } catch (e) {
        return null;
    }
}

async function denormalizeMultiple(items: Item[], store: HydraStore): Promise<(Object | null)[]> {
    return Promise.all(items.map((item) => denormalizeSingle(item, store)));
}

type ItemFilterType = string | null | (string | null)[];

export class ItemFilter implements Filter<ItemFilterType> {
    items: Item[] = [];
    multiple: boolean;
    store: HydraStore;
    constructor(items: any, { store, multiple = false }: { store: HydraStore; multiple?: boolean }) {
        this.items = Array.isArray(items) ? items : [items];
        this.store = store;
        this.multiple = multiple;
    }

    get item(): Item {
        return this.items[0] ?? null;
    }

    set item(item) {
        this.items = [item];
        this.multiple = false;
    }

    normalize(): ItemFilterType {
        return this.multiple || this.items.length > 1 ? normalizeMultiple(this.items) : normalizeSingle(this.item);
    }

    async denormalize(input: any) {
        if (Array.isArray(input)) {
            this.items = await denormalizeMultiple(input, this.store);

            return;
        }

        this.items = [await denormalizeSingle(input, this.store)];
    }
}
