export function paginate(items, query = {}, defaultLimit = 20) {
  const page = Math.max(Number(query.page || 1), 1);
  const limit = Math.max(Number(query.limit || defaultLimit), 1);
  const total = items.length;
  const pages = Math.max(Math.ceil(total / limit), 1);
  const start = (page - 1) * limit;

  return {
    items: items.slice(start, start + limit),
    pagination: { page, limit, total, pages }
  };
}

export function includesText(value, search) {
  if (!search) return true;
  return String(value || '').toLowerCase().includes(String(search).toLowerCase());
}
