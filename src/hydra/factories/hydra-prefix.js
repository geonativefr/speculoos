/*
 * API Platform sends the Hydra keys with the `hydra:` prefix, or without it (`hydra_prefix: false`, its default from
 * version 4). An unprefixed key is stored under its prefixed name, so that both forms are read the same way. When a
 * payload carries both forms of a key, the prefixed one wins, whatever their order.
 */
export const setPrefixed = (target, key, value) => {
  const prefixedKey = `hydra:${key}`;
  if (!Object.prototype.hasOwnProperty.call(target, prefixedKey)) {
    target[prefixedKey] = value;
  }
};
