import { unref } from 'vue';

export function hasIri(item) {
  item = unref(item);
  if (null == item) {
    return false;
  }
  return Object.keys(item).includes('@id') && null != item['@id'];
}

export function getIri(itemOrIRI) {
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

export function getId(itemOrIRI) {
  const iri = getIri(itemOrIRI);
  return iri.substring(iri.lastIndexOf('/') + 1);
}

export function getIris(itemsOrIRIs) {
  return itemsOrIRIs.map(getIri);
}

export function getIds(itemsOrIRIs) {
  return itemsOrIRIs.map(getId);
}

export function checkValidItem(item, type = null) {
  if ('object' !== typeof item || !('@id' in item)) {
    throw Error('Invalid item.');
  }

  if (null !== type) {
    if ('string' === typeof type && type !== item['@type']) {
      throw Error(`Expected item of type "${type}", got "${item['@type']}".`);
    }
    if (Array.isArray(type) && false === type.includes(item['@type'])) {
      throw Error(`Expected item of any "${type.join('|')}", got "${item['@type']}".`);
    }
  }
}

export function areSameIris(a, b) {
  return getIri(a) === getIri(b);
}

export function containsIri(itemsOrIris, iriOrItem) {
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

export function withoutIri(itemsOrIris, itemOrIri) {
  const index = itemsOrIris.findIndex(item => areSameIris(item, itemOrIri));
  if (index >= 0) {
    itemsOrIris.splice(index, 1);
  }

  return itemsOrIris;
}

export function getItemByIri(items, iri) {
  const item = items.find(item => areSameIris(item, iri));
  return 'undefined' === typeof item ? null : item;
}

export function getItemIndexByIri(items, iri) {
  return items.findIndex(item => areSameIris(item, iri));
}

export function getItemsByType(items, type) {
  return items.filter(item => item['@type'] === type);
}

export function normalizeIris(itemOrIris) {
  Object.assign(itemOrIris, itemOrIris.map(itemOrIri => getIri(itemOrIri)));
}

export function partialItem(item, mergeWith) {
  item = unref(item);
  checkValidItem(item);
  return Object.assign({'@id': item['@id'], '@type': item['@type']}, mergeWith);
}
