/**
 * Creates a new object with the specified keys omitted.
 * @template {Record<string, any>} T
 * @param {T} object - The source object
 * @param {Iterable<string | number | symbol>} keys - The keys to omit
 * @returns {Partial<T>} A new object without the specified keys
 */
function omit(object, keys) {
  const keySet = new Set(keys);
  return /** @type {Partial<T>} */ (
    Object.fromEntries(
      Object.entries(object).filter(([key]) => !keySet.has(key)),
    )
  );
}

export default omit;
