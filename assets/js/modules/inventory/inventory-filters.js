function getCurrentHashParts() {
  const rawHash = window.location.hash || '';
  const cleanHash = rawHash.startsWith('#') ? rawHash.slice(1) : rawHash;
  const [pathPart = '', queryString = ''] = cleanHash.split('?');

  return {
    path: pathPart ? `#${pathPart}` : '#inventory',
    params: new URLSearchParams(queryString),
  };
}

export function getInventoryPageFilters(defaults = {}) {
  const { params } = getCurrentHashParts();

  return {
    query: params.get('query') || defaults.query || '',
    warehouse: params.get('warehouse') || defaults.warehouse || '',
    movementType: params.get('movementType') || defaults.movementType || '',
    direction: params.get('direction') || defaults.direction || '',
    sortBy: params.get('sortBy') || defaults.sortBy || 'date_desc',
    page: Number(params.get('page') || defaults.page || 1),
  };
}

export function updateInventoryPageFilters(nextFilters = {}) {
  const { path, params } = getCurrentHashParts();

  Object.entries(nextFilters).forEach(([key, value]) => {
    const normalizedValue = value ?? '';

    if (
      normalizedValue === '' ||
      normalizedValue === null ||
      normalizedValue === undefined ||
      normalizedValue === 'all'
    ) {
      params.delete(key);
      return;
    }

    params.set(key, String(normalizedValue));
  });

  const queryString = params.toString();
  const nextHash = queryString ? `${path.slice(1)}?${queryString}` : path.slice(1);

  window.location.hash = `#${nextHash}`;
}

export function resetInventoryPageFilters(keys = []) {
  const { path, params } = getCurrentHashParts();

  keys.forEach((key) => params.delete(key));

  const queryString = params.toString();
  const nextHash = queryString ? `${path.slice(1)}?${queryString}` : path.slice(1);

  window.location.hash = `#${nextHash}`;
}
