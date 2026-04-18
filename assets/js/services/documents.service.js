// assets/js/services/documents.service.js

import {
  searchDocuments,
  getDocumentById,
  createDocument,
  updateDocument,
  addDocumentLine,
  updateDocumentLine,
  removeDocumentLine,
  getDocumentLines,
  getDocumentTotals,
  postDocument,
  cancelDocument,
  getProducts,
  getWarehouses,
} from '../core/state.js';

/* =========================================================
   NORMALIZERS
========================================================= */

function normalizeText(value) {
  return String(value || '').trim().toLowerCase();
}

function getStatusLabel(status) {
  switch (status) {
    case 'draft':
      return 'Draft';
    case 'posted':
      return 'Posted';
    case 'cancelled':
      return 'Cancelled';
    default:
      return status || '-';
  }
}

function normalizeLine(line = {}) {
  const quantity = Number(line.quantity || 0);
  const unitPrice = Number(line.unitPrice || 0);

  return {
    ...line,
    quantity,
    unitPrice,
    total:
      line.total != null
        ? Number(line.total || 0)
        : quantity * unitPrice,
  };
}

function normalizeDocument(doc) {
  if (!doc) return null;

  const lines = Array.isArray(doc.lines) ? doc.lines.map(normalizeLine) : [];
  const totals = doc.totals || {};

  const linesCount =
    totals.linesCount != null
      ? Number(totals.linesCount || 0)
      : lines.length;

  const grandTotal =
    totals.grandTotal != null
      ? Number(totals.grandTotal || 0)
      : lines.reduce((sum, line) => sum + Number(line.total || 0), 0);

  return {
    ...doc,
    lines,
    totals: {
      linesCount,
      grandTotal,
    },
    linesCount,
    grandTotal,
    statusLabel: getStatusLabel(doc.status),
    canEdit: doc.status === 'draft',
    canPost: doc.status === 'draft',
    canCancel: doc.status === 'posted',
  };
}

function normalizeProduct(product = {}) {
  return {
    ...product,
    label: product.sku
      ? `${product.name} (${product.sku})`
      : product.name || product.id || '-',
  };
}

function normalizeWarehouse(warehouse = {}) {
  return {
    ...warehouse,
    label: warehouse.name || warehouse.id || '-',
  };
}

/* =========================================================
   FILTERS / SORT / PAGINATION
========================================================= */

function applyFilters(list, filters = {}) {
  let result = [...list];

  if (filters.query) {
    const q = normalizeText(filters.query);

    result = result.filter((doc) =>
      [doc.number, doc.type, doc.origin, doc.destination]
        .join(' ')
        .toLowerCase()
        .includes(q)
    );
  }

  if (filters.status && filters.status !== 'all') {
    result = result.filter((doc) => doc.status === filters.status);
  }

  if (filters.type && filters.type !== 'all') {
    result = result.filter((doc) => doc.type === filters.type);
  }

  return result;
}

function applySort(list, sort = {}) {
  const field = sort.field || 'date';
  const direction = sort.direction === 'asc' ? 'asc' : 'desc';

  return [...list].sort((a, b) => {
    let valueA;
    let valueB;

    if (field === 'number') {
      valueA = String(a.number || '');
      valueB = String(b.number || '');
      const compare = valueA.localeCompare(valueB);
      return direction === 'asc' ? compare : -compare;
    }

    valueA = new Date(a.date || 0).getTime();
    valueB = new Date(b.date || 0).getTime();

    if (valueA < valueB) return direction === 'asc' ? -1 : 1;
    if (valueA > valueB) return direction === 'asc' ? 1 : -1;
    return 0;
  });
}

function applyPagination(list, pagination = {}) {
  const page = Math.max(1, Number(pagination.page || 1));
  const pageSize = Math.max(1, Number(pagination.pageSize || 10));

  const total = list.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, totalPages);

  const start = (safePage - 1) * pageSize;
  const end = start + pageSize;

  return {
    data: list.slice(start, end),
    meta: {
      total,
      totalPages,
      page: safePage,
      pageSize,
      hasPrev: safePage > 1,
      hasNext: safePage < totalPages,
    },
  };
}

function buildSummary(list) {
  return {
    total: list.length,
    draft: list.filter((doc) => doc.status === 'draft').length,
    posted: list.filter((doc) => doc.status === 'posted').length,
    cancelled: list.filter((doc) => doc.status === 'cancelled').length,
  };
}

/* =========================================================
   AUXILIARY LOOKUPS
========================================================= */

function getProductsList() {
  return (getProducts() || []).map(normalizeProduct);
}

function getWarehousesList() {
  return (getWarehouses() || []).map(normalizeWarehouse);
}

function findProductById(productId) {
  return getProductsList().find((product) => product.id === productId) || null;
}

function findWarehouseById(warehouseId) {
  return getWarehousesList().find((warehouse) => warehouse.id === warehouseId) || null;
}

function findWarehouseByName(name) {
  return (
    getWarehousesList().find(
      (warehouse) => normalizeText(warehouse.name) === normalizeText(name)
    ) || null
  );
}

function normalizeDocumentType(type) {
  const lookup = normalizeText(type);

  if (lookup === 'transferência' || lookup === 'transferencia' || lookup === 'transfer') {
    return 'Transferência';
  }

  if (lookup === 'ajuste' || lookup === 'entrada' || lookup === 'adjustment') {
    return 'Ajuste';
  }

  return type || 'Transferência';
}

function resolveWarehouseName(value) {
  if (!value) return '';

  const byId = findWarehouseById(value);
  if (byId) return byId.name;

  const byName = findWarehouseByName(value);
  if (byName) return byName.name;

  return String(value).trim();
}

function normalizePayloadLine(line = {}) {
  let productId = line.product_id || '';
  let item = line.item || '';

  if (productId) {
    const product = findProductById(productId);
    if (product) {
      item = product.name || item;
    }
  }

  return {
    product_id: productId,
    item,
    quantity: Number(line.quantity || 0),
    unitPrice: Number(line.unitPrice || 0),
  };
}

/* =========================================================
   VALIDATION
========================================================= */

function assertDocumentExists(documentId) {
  const document = getDocumentById(documentId);

  if (!document) {
    throw new Error('Documento não encontrado.');
  }

  return document;
}

function assertDraftDocument(documentId) {
  const document = assertDocumentExists(documentId);

  if (document.status !== 'draft') {
    throw new Error('Apenas documentos em draft podem ser alterados.');
  }

  return document;
}

function validateHeaderPayload(payload = {}) {
  if (!payload.date) {
    throw new Error('Data obrigatória.');
  }

  const normalizedType = normalizeDocumentType(payload.type);

  if (!normalizedType) {
    throw new Error('Tipo obrigatório.');
  }

  const originName = resolveWarehouseName(payload.origin);
  const destinationName = resolveWarehouseName(payload.destination);

  if (normalizedType === 'Transferência') {
    if (!originName) {
      throw new Error('Origem obrigatória.');
    }

    if (!destinationName) {
      throw new Error('Destino obrigatório.');
    }

    if (normalizeText(originName) === normalizeText(destinationName)) {
      throw new Error('Origem e destino não podem ser iguais.');
    }
  }

  if (normalizedType === 'Ajuste') {
    if (!destinationName) {
      throw new Error('Destino obrigatório.');
    }
  }

  return {
    date: payload.date,
    type: normalizedType,
    origin: normalizedType === 'Ajuste' ? '' : originName,
    destination: destinationName,
  };
}

function validateLinesPayload(lines = []) {
  if (!Array.isArray(lines) || !lines.length) {
    throw new Error('Adicione pelo menos uma linha.');
  }

  const normalizedLines = lines.map(normalizePayloadLine);

  normalizedLines.forEach((line, index) => {
    const row = index + 1;

    if (!line.product_id) {
      throw new Error(`Linha ${row}: selecione produto.`);
    }

    if (!findProductById(line.product_id)) {
      throw new Error(`Linha ${row}: produto inválido.`);
    }

    if (!Number.isFinite(line.quantity) || line.quantity <= 0) {
      throw new Error(`Linha ${row}: quantidade inválida.`);
    }

    if (!Number.isFinite(line.unitPrice) || line.unitPrice < 0) {
      throw new Error(`Linha ${row}: preço inválido.`);
    }
  });

  return normalizedLines;
}

function validateFullPayload(payload = {}) {
  const header = validateHeaderPayload(payload);
  const lines = validateLinesPayload(payload.lines || []);

  return {
    ...header,
    lines,
  };
}

/* =========================================================
   READ APIS
========================================================= */

export function listDocuments(options = {}) {
  const {
    filters = {},
    sort = { field: 'date', direction: 'desc' },
    pagination = { page: 1, pageSize: 10 },
  } = options;

  const raw = searchDocuments({
    query: '',
    status: '',
    sortBy: 'date_desc',
  });

  const normalized = raw.map(normalizeDocument);
  const filtered = applyFilters(normalized, filters);
  const sorted = applySort(filtered, sort);
  const paginated = applyPagination(sorted, pagination);
  const summary = buildSummary(normalized);

  return {
    data: paginated.data,
    meta: paginated.meta,
    summary,
  };
}

export function getDocumentsList(options = {}) {
  const result = listDocuments({
    filters: {
      query: options.query || '',
      status: options.status || 'all',
      type: options.type || 'all',
    },
    sort: {
      field: options.sortBy?.startsWith('number') ? 'number' : 'date',
      direction:
        options.sortBy === 'dateAsc' || options.sortBy === 'numberAsc'
          ? 'asc'
          : 'desc',
    },
    pagination: {
      page: options.page || 1,
      pageSize: options.pageSize || 10,
    },
  });

  return {
    items: result.data,
    summaries: result.summary,
    pagination: {
      page: result.meta.page,
      totalPages: result.meta.totalPages,
      hasPrev: result.meta.hasPrev,
      hasNext: result.meta.hasNext,
      total: result.meta.total,
      pageSize: result.meta.pageSize,
    },
  };
}

export function getDocument(documentId) {
  return normalizeDocument(getDocumentById(documentId));
}

export function getDocumentService(documentId) {
  return getDocument(documentId);
}

export function getProductsService() {
  return getProductsList();
}

export function getWarehousesService() {
  return getWarehousesList();
}

export function getDocumentFormOptions() {
  return {
    products: getProductsList(),
    warehouses: getWarehousesList(),
    documentTypes: ['Transferência', 'Ajuste'],
  };
}

/* =========================================================
   WRITE APIS
========================================================= */

export function createNewDocument(payload = {}) {
  const validated = validateFullPayload(payload);

  const created = createDocument({
    date: validated.date,
    type: validated.type,
    origin: validated.origin,
    destination: validated.destination,
  });

  validated.lines.forEach((line) => {
    addDocumentLine(created.id, {
      product_id: line.product_id,
      item: line.item,
      quantity: line.quantity,
      unitPrice: line.unitPrice,
    });
  });

  return getDocument(created.id);
}

export function updateExistingDocument(documentId, payload = {}) {
  assertDraftDocument(documentId);

  const validated = validateFullPayload(payload);

  updateDocument(documentId, {
    date: validated.date,
    type: validated.type,
    origin: validated.origin,
    destination: validated.destination,
  });

  const currentLines = getDocumentLines(documentId) || [];

  currentLines.forEach((line) => {
    removeDocumentLine(documentId, line.id);
  });

  validated.lines.forEach((line) => {
    addDocumentLine(documentId, {
      product_id: line.product_id,
      item: line.item,
      quantity: line.quantity,
      unitPrice: line.unitPrice,
    });
  });

  return getDocument(documentId);
}

export function saveDocumentService(payload = {}) {
  if (payload.id) {
    return updateExistingDocument(payload.id, payload);
  }

  return createNewDocument(payload);
}

/* =========================================================
   LINE APIS
========================================================= */

export function addDocumentLineService(documentId, lineData) {
  assertDraftDocument(documentId);

  const [validatedLine] = validateLinesPayload([lineData]);

  return normalizeLine(
    addDocumentLine(documentId, {
      product_id: validatedLine.product_id,
      item: validatedLine.item,
      quantity: validatedLine.quantity,
      unitPrice: validatedLine.unitPrice,
    })
  );
}

export function updateDocumentLineService(documentId, lineId, lineData) {
  assertDraftDocument(documentId);

  const [validatedLine] = validateLinesPayload([lineData]);

  return normalizeLine(
    updateDocumentLine(documentId, lineId, {
      product_id: validatedLine.product_id,
      item: validatedLine.item,
      quantity: validatedLine.quantity,
      unitPrice: validatedLine.unitPrice,
    })
  );
}

export function removeDocumentLineService(documentId, lineId) {
  assertDraftDocument(documentId);
  removeDocumentLine(documentId, lineId);
  return getDocument(documentId);
}

export function getDocumentTotalsService(documentId) {
  const totals = getDocumentTotals(documentId) || {
    linesCount: 0,
    grandTotal: 0,
  };

  return {
    linesCount: Number(totals.linesCount || 0),
    grandTotal: Number(totals.grandTotal || 0),
  };
}

/* =========================================================
   BUSINESS ACTIONS
========================================================= */

export function postDocumentService(documentId) {
  return normalizeDocument(postDocument(documentId));
}

export function cancelDocumentService(documentId, reason = '') {
  return normalizeDocument(cancelDocument(documentId, reason));
}

export function removeDocument() {
  throw new Error('Remoção de documentos não suportada neste sistema.');
}
