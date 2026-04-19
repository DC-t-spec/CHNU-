import * as state from '../core/state.js';

function hasStateMethod(name) {
  return typeof state[name] === 'function';
}

function callStateStrict(methodNames, ...args) {
  for (const name of methodNames) {
    if (hasStateMethod(name)) {
      return state[name](...args);
    }
  }

  throw new Error(`Método do state não encontrado: ${methodNames.join(' | ')}`);
}

function callStateLoose(methodNames, ...args) {
  for (const name of methodNames) {
    if (hasStateMethod(name)) {
      return state[name](...args);
    }
  }

  return null;
}

function toNumber(value, fallback = 0) {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
}

function normalizeLine(line = {}, index = 0) {
  const quantity = toNumber(line.quantity ?? line.qty, 0);
  const unitPrice = toNumber(line.unitPrice ?? line.unit_price, 0);

  return {
    id: line.id ?? `line-${index + 1}`,
    product_id: line.product_id ?? line.productId ?? line.itemId ?? '',
    warehouse_id: line.warehouse_id ?? line.warehouseId ?? '',
    itemId: line.itemId ?? line.product_id ?? '',
    itemCode: line.itemCode ?? line.item_code ?? '',
    itemName: line.itemName ?? line.item_name ?? line.productName ?? '',
    description: line.description ?? '',
    quantity,
    unit: line.unit ?? 'un',
    unitPrice,
    total: quantity * unitPrice,
  };
}

function normalizeLines(lines = []) {
  return (Array.isArray(lines) ? lines : [])
    .map((line, index) => normalizeLine(line, index))
    .filter((line) => line.product_id || line.itemName || line.description || line.quantity > 0 || line.unitPrice > 0);
}

function computeTotals(lines = []) {
  const normalized = normalizeLines(lines);

  return {
    linesCount: normalized.length,
    grandTotal: normalized.reduce((sum, line) => sum + line.total, 0),
  };
}

function normalizeDocument(doc = {}) {
  const lines = normalizeLines(doc.lines ?? []);
  const totals = computeTotals(lines);

  return {
    id: doc.id ?? '',
    number: doc.number ?? '',
    type: doc.type ?? 'Transferência',
    status: doc.status ?? 'draft',
    date: doc.date ?? new Date().toISOString().slice(0, 10),
    reference: doc.reference ?? '',
    notes: doc.notes ?? '',
    origin: doc.origin ?? '',
    destination: doc.destination ?? '',
    postedAt: doc.postedAt ?? doc.posted_at ?? null,
    cancelledAt: doc.cancelledAt ?? doc.cancelled_at ?? null,
    cancelReason: doc.cancelReason ?? doc.cancel_reason ?? '',
    createdAt: doc.createdAt ?? doc.created_at ?? null,
    updatedAt: doc.updatedAt ?? doc.updated_at ?? null,
    lines,
    linesCount: doc.linesCount ?? totals.linesCount,
    grandTotal: toNumber(doc.grandTotal ?? doc.grand_total, totals.grandTotal),
  };
}

function getWarehousesInternal() {
  const result = callStateLoose(
    ['getWarehouses', 'listWarehouses', 'getLocations', 'getWarehousesService'],
    {}
  ) ?? [];

  return (Array.isArray(result) ? result : []).map((warehouse, index) => ({
    id: warehouse.id ?? `warehouse-${index + 1}`,
    code: warehouse.code ?? '',
    name: warehouse.name ?? warehouse.label ?? `Armazém ${index + 1}`,
  }));
}

function mapWarehouseName(value) {
  if (!value) return '';

  const warehouse = getWarehousesInternal().find(
    (item) => item.id === value || item.name === value
  );

  return warehouse ? warehouse.name : value;
}

function buildDocumentPayload(values = {}) {
  const lines = normalizeLines(values.lines ?? []);
  const totals = computeTotals(lines);

  return {
    id: values.id ?? '',
    number: values.number ?? '',
    type: values.type ?? 'Transferência',
    status: values.status ?? 'draft',
    date: values.date ?? new Date().toISOString().slice(0, 10),
    reference: values.reference ?? '',
    notes: values.notes ?? '',
    origin: mapWarehouseName(values.origin ?? ''),
    destination: mapWarehouseName(values.destination ?? ''),
    lines: lines.map((line) => ({
      id: line.id,
      product_id: line.product_id,
      warehouse_id: line.warehouse_id,
      itemId: line.itemId,
      itemCode: line.itemCode,
      itemName: line.itemName,
      description: line.description,
      quantity: line.quantity,
      unit: line.unit,
      unitPrice: line.unitPrice,
      total: line.total,
    })),
    linesCount: totals.linesCount,
    grandTotal: totals.grandTotal,
  };
}

/* ===============================
   DOCUMENTS
=============================== */

export function listDocuments(filters = {}) {
  const result = callStateLoose(
    ['searchDocuments', 'getDocuments', 'listDocuments'],
    filters
  ) ?? [];

  const docs = (Array.isArray(result) ? result : []).map(normalizeDocument);

  const query = String(filters.query ?? '').trim().toLowerCase();
  const status = filters.status ?? null;

  return docs.filter((doc) => {
    const matchStatus = status ? doc.status === status : true;

    const matchQuery = query
      ? [
          doc.number,
          doc.type,
          doc.reference,
          doc.origin,
          doc.destination,
          doc.notes,
        ]
          .join(' ')
          .toLowerCase()
          .includes(query)
      : true;

    return matchStatus && matchQuery;
  });
}

export function getDocumentsCounters() {
  const all = listDocuments({});

  return {
    total: all.length,
    draft: all.filter((doc) => doc.status === 'draft').length,
    posted: all.filter((doc) => doc.status === 'posted').length,
    cancelled: all.filter((doc) => doc.status === 'cancelled').length,
  };
}

export function getDocumentById(documentId) {
  if (!documentId) return null;

  const direct = callStateLoose(
    ['getDocumentById', 'findDocumentById', 'getDocument', 'getDocumentService'],
    documentId
  );

  if (direct) return normalizeDocument(direct);

  const fallback = listDocuments({}).find((doc) => doc.id === documentId);
  return fallback ? normalizeDocument(fallback) : null;
}

export function createDocument(values = {}) {
  const payload = buildDocumentPayload(values);

  const created = callStateStrict(
    ['createDocument', 'addDocument', 'saveDocumentService', 'saveDocument'],
    payload
  );

  if (!created || !created.id) {
    throw new Error('O documento não foi gravado no state.');
  }

  return normalizeDocument(created);
}

export function updateDocument(documentId, values = {}) {
  const payload = buildDocumentPayload({ ...values, id: documentId });

  const updated = callStateStrict(
    ['updateDocument', 'editDocument', 'saveDocumentService', 'saveDocument'],
    documentId,
    payload
  );

  if (!updated || !updated.id) {
    throw new Error('O documento não foi actualizado no state.');
  }

  return normalizeDocument(updated);
}

export function saveDocument(values = {}) {
  if (values.id) {
    return updateDocument(values.id, values);
  }

  return createDocument(values);
}

export function postDocumentById(documentId) {
  return callStateStrict(['postDocument'], documentId);
}

export function cancelDocumentById(documentId, reason) {
  return callStateStrict(['cancelDocument'], documentId, reason);
}

/* ===============================
   PRODUCTS
=============================== */

export function getProducts() {
  const result = callStateLoose(
    ['getProducts', 'listProducts', 'getInventoryProducts', 'getProductsService'],
    {}
  ) ?? [];

  return (Array.isArray(result) ? result : []).map((product, index) => ({
    id: product.id ?? `product-${index + 1}`,
    code: product.code ?? '',
    name: product.name ?? product.itemName ?? product.description ?? `Produto ${index + 1}`,
    unitPrice: toNumber(product.unitPrice ?? product.price ?? product.avgCost, 0),
  }));
}

/* ===============================
   WAREHOUSES
=============================== */

export function getWarehouses() {
  return getWarehousesInternal();
}
