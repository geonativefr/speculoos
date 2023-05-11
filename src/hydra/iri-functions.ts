import { unref } from 'vue';
import { Item } from '../model';

export function hasIri(item: Item): boolean {
    item = unref(item);
    if (null == item) {
        return false;
    }
    return Object.keys(item).includes('@id') && null != item['@id'];
}

export function getIri(itemOrIRI: string | Item): string | null {
    itemOrIRI = unref(itemOrIRI);
    if (null === itemOrIRI) {
        return null;
    }
    if ('string' === typeof itemOrIRI) {
        return itemOrIRI;
    }
    checkValidItem(itemOrIRI);
    return itemOrIRI['@id'];
}

export function getId(itemOrIRI: string | Item): string | null {
    const iri = getIri(itemOrIRI);
    return iri?.substring(iri.lastIndexOf('/') + 1) ?? null;
}

export function getIris(itemsOrIRIs: (string | Item)[]): (string | null)[] {
    return itemsOrIRIs.map(getIri);
}

export function getIds(itemsOrIRIs: (string | Item)[]): (string | null)[] {
    return itemsOrIRIs.map(getId);
}

export function checkValidItem(item: Item, type?: string): void | never {
    if (!item || 'object' !== typeof item || !('@id' in item)) {
        throw Error('Invalid item.');
    }

    if (type) {
        if ('string' === typeof type && type !== item['@type']) {
            throw Error(`Expected item of type "${type}", got "${item['@type']}".`);
        }
        if (Array.isArray(type) && false === type.includes(item['@type'])) {
            throw Error(`Expected item of any "${type.join('|')}", got "${item['@type']}".`);
        }
    }
}

export function areSameIris(a: string | Item, b: string | Item): boolean {
    return getIri(a) === getIri(b);
}

export function containsIri(itemsOrIris: Item[], iriOrItem: Item): boolean {
    itemsOrIris = unref(itemsOrIris);
    itemsOrIris = Array.from(itemsOrIris).map(unref);
    iriOrItem = unref(iriOrItem);
    // Iris intersection
    if (Array.isArray(iriOrItem)) {
        const items = iriOrItem;
        for (const iriOrItem of items) {
            if (containsIri(itemsOrIris, iriOrItem)) {
                return true;
            }
        }
        return false;
    }
    for (const itemOrIri of itemsOrIris) {
        if (areSameIris(itemOrIri, iriOrItem)) {
            return true;
        }
    }

    return false;
}

export function withoutIri(itemsOrIris: (string | Item)[], itemOrIri: string | Item): (string | Item)[] {
    const index = itemsOrIris.findIndex((item) => areSameIris(item, itemOrIri));
    if (index >= 0) {
        itemsOrIris.splice(index, 1);
    }

    return itemsOrIris;
}

export function getItemByIri(items: Item[], iri: Item | string): Item | null {
    const item = items.find((item) => areSameIris(item, iri));
    return 'undefined' === typeof item ? null : item;
}

export function getItemIndexByIri(items: Item[], iri: string): number {
    return items.findIndex((item) => areSameIris(item, iri));
}

export function getItemsByType(items: Item[], type: string): Item[] {
    return items.filter((item) => item['@type'] === type);
}

export function normalizeIris(itemOrIris: (string | Item)[]): void {
    Object.assign(
        itemOrIris,
        itemOrIris.map((itemOrIri) => getIri(itemOrIri))
    );
}

export function partialItem(item: Item, mergeWith: any): Item {
    item = unref(item);
    checkValidItem(item);
    return Object.assign({ '@id': item['@id'], '@type': item['@type'] }, mergeWith);
}
