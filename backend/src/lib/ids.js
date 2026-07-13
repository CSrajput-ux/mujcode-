export function nextId(prefix = 'id') {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function nextNumber(collection, field = 'id') {
  const values = collection
    .map(item => Number(item[field]))
    .filter(Number.isFinite);

  return values.length ? Math.max(...values) + 1 : 1;
}
