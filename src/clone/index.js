const readsSlots = {
  Date: Date.prototype.getTime,
  RegExp: Object.getOwnPropertyDescriptor(RegExp.prototype, 'source').get,
  Map: Map.prototype.has,
  Set: Set.prototype.has,
};

// An object can inherit from a native type without holding its internal slots, as Object.create(Date.prototype) does.
function isNative(orig, Native) {
  if (!(orig instanceof Native)) {
    return false;
  }
  try {
    readsSlots[Native.name].call(orig);
    return true;
  } catch (e) {
    return false;
  }
}

function createNative(orig) {
  if (isNative(orig, Date)) {
    return new Date(orig.getTime());
  }
  if (isNative(orig, RegExp)) {
    const cloned = new RegExp(orig.source, orig.flags);
    cloned.lastIndex = orig.lastIndex;
    return cloned;
  }
  if (isNative(orig, Map)) {
    return new Map();
  }
  if (isNative(orig, Set)) {
    return new Set();
  }

  return null;
}

// Dates, regular expressions, maps and sets keep their data in internal slots, which only their constructor creates.
function createEmpty(orig) {
  const native = createNative(orig);
  if (null == native) {
    return Object.create(Object.getPrototypeOf(orig));
  }

  return Object.setPrototypeOf(native, Object.getPrototypeOf(orig));
}

export const clone = (orig, deep = true, duplicates = []) => {
  if ('object' !== typeof orig || null == orig) {
    return orig;
  }

  const duplicate = duplicates.find(item => item.orig === orig);
  if (null != duplicate) {
    return duplicate.cloned;
  }

  let cloned = Object.assign(createEmpty(orig), orig);
  if (Array.isArray(orig)) {
    cloned = Object.values(cloned);
  }
  duplicates.push({orig, cloned});

  const cloneEntry = (value) => deep ? clone(value, deep, duplicates) : value;
  if (isNative(orig, Map)) {
    orig.forEach((value, key) => cloned.set(cloneEntry(key), cloneEntry(value)));
  }
  if (isNative(orig, Set)) {
    orig.forEach(value => cloned.add(cloneEntry(value)));
  }

  if (deep) {
    for (const prop in cloned) {
      if ('object' === typeof cloned[prop] && null != cloned[prop]) {
        cloned[prop] = clone(cloned[prop], deep, duplicates);
      }
    }
  }

  if ('__clone' in cloned && 'function' === typeof cloned.__clone) {
    cloned.__clone();
  }

  return cloned;
};
