async function processWithLimit<T, R>(
  items: T[],
  limit: number,
  fn: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  const executing = new Set<Promise<void>>();
  for (const [i, item] of items.entries()) {
    const promise = fn(item, i)
      .then((result) => {
        results[i] = result;
      })
      .finally(() => executing.delete(promise));
    executing.add(promise);
    if (executing.size >= limit) {
      await Promise.race(executing);
    }
  }
  await Promise.all(executing);
  return results;
}

// T is type of item array / R is return value of the promise from fn

export { processWithLimit };
