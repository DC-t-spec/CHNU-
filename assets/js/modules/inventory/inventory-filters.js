function getInventoryBasePath() {
  const hash = window.location.hash || '#inventory-balances';
  const [pathPart] = hash.split('?');
  return pathPart || '#inventory-balances';
}

function getHashParams() {
  const hash = window.location.hash || '';
  const [, queryString = ''] = hash.split('?');
  return new URLSearchParams(queryString);
}

function normalizeFilterValue(value, fallback = '') {
  if (value == null) return fallback;
  return String(value).trim();
}

function buildHash(basePath, params) {
  const queryString = params.toString();
  return queryString ? `${basePath}?${queryString}` : basePath;
}

export function getInventoryPageFilters(defaults = {}) {
  const params = getHashParams();

  return {
    query: normalizeFilterValue(params.get('query'), defaults.query || ''),
    warehouse: normalizeFilterValue(params.get('warehouse'), defaults.warehouse || ''),
    status: normalizeFilterValue(params.get('status'), defaults.status || ''),
    movementType: normalizeFilterValue(params.get('movementType'), defaults.movementType || ''),
    direction: normalizeFilterValue(params.get('direction'), defaults.direction || ''),
    sortBy: normalizeFilterValue(params.get('sortBy'), defaults.sortBy || ''),
    page: Number(params.get('page') || defaults.page || 1),
  };
}

export function updateInventoryPageFilters(nextFilters = {}) {
  const basePath = getInventoryBasePath();
  const current = getInventoryPageFilters();
  const params = new URLSearchParams();

  const merged = {
    ...current,
    ...nextFilters,
  };

  if (normalizeFilterValue(merged.query)) {
    params.set('query', normalizeFilterValue(merged.query));
  }

  if (normalizeFilterValue(merged.warehouse)) {
    params.set('warehouse', normalizeFilterValue(merged.warehouse));
  }

  if (normalizeFilterValue(merged.status)) {
    params.set('status', normalizeFilterValue(merged.status));
  }

  if (normalizeFilterValue(merged.movementType)) {
    params.set('movementType', normalizeFilterValue(merged.movementType));
  }

  if (normalizeFilterValue(merged.direction)) {
    params.set('direction', normalizeFilterValue(merged.direction));
  }

  if (normalizeFilterValue(merged.sortBy)) {
    params.set('sortBy', normalizeFilterValue(merged.sortBy));
  }

  const page = Number(merged.page || 1);
  if (page > 1) {
    params.set('page', String(page));
  }

  window.location.hash = buildHash(basePath, params);
}

export function resetInventoryPageFilters(keys = []) {
  const basePath = getInventoryBasePath();
  const current = getInventoryPageFilters();
  const params = new URLSearchParams();

  const filters = { ...current };

  keys.forEach((key) => {
    if (key in filters) {
      if (key === 'page') {
        filters[key] = 1;
      } else {
        filters[key] = '';
      }
    }
  });

  if (normalizeFilterValue(filters.query)) {
    params.set('query', normalizeFilterValue(filters.query));
  }

  if (normalizeFilterValue(filters.warehouse)) {
    params.set('warehouse', normalizeFilterValue(filters.warehouse));
  }

  if (normalizeFilterValue(filters.status)) {
    params.set('status', normalizeFilterValue(filters.status));
  }

  if (normalizeFilterValue(filters.movementType)) {
    params.set('movementType', normalizeFilterValue(filters.movementType));
  }

  if (normalizeFilterValue(filters.direction)) {
    params.set('direction', normalizeFilterValue(filters.direction));
  }

  if (normalizeFilterValue(filters.sortBy)) {
    params.set('sortBy', normalizeFilterValue(filters.sortBy));
  }

  const page = Number(filters.page || 1);
  if (page > 1) {
    params.set('page', String(page));
  }

  window.location.hash = buildHash(basePath, params);
}
