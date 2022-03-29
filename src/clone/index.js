export const clone = (orig, deep = true, duplicates = []) => {
  if ('object' !== typeof orig || null == orig) {
    return orig;
  }

  const duplicate = duplicates.find(item => item.orig === orig);
  if (null != duplicate) {
    return duplicate.cloned;
  }

  let cloned = Object.assign(Object.create(Object.getPrototypeOf(orig)), orig);
  if (Array.isArray(orig)) {
    cloned = Object.values(cloned);
  }
  duplicates.push({orig, cloned});

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
