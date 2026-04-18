import * as state from '../core/state.js';

function callState(methodNames, ...args) {
  for (const name of methodNames) {
    if (typeof state[name] === 'function') {
      return state[name](...args);
    }
  }

  throw new Error(`Função não encontrada no state: ${methodNames.join(' | ')}`);
}

function toNumber(value, fallback = 0) {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
}

function normalizeLine(line = {}, index = 0) {
  const quantity = toNumber(line.quantity ?? line.qty, 0);
  const unitPrice = toNumber(line.unitPrice ?? line.unit_price, 0);
  const total = quantity * unitPrice;

  return {
    id: line.id ?? `line-${index + 1}`,
    itemId: line.itemId ?? line.item_id ?? '',
    itemCode: line.itemCode ?? line.item_code ?? '',
    itemName: line.itemName ?? line.item_name ?? '',
    description: line.description ?? '',
    quantity,
    unit: line.unit ?? 'un',
    unitPrice,
    total,
  };
}

function normalizeLines(lines = []) {
  return (Array.isArray(lines) ? lines : [])
    .map((line, index) => normalizeLine(line, index))
    .filter((line) => line.itemName || line.description || line.quantity > 0 || line.unitPrice > 0);
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
    type: doc.type ?? 'transfer',
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

export function listDocuments(filters = {}) {
  const result = callState(['searchDocuments', 'getDocuments'], filters);

  return (Array.isArray(result) ? result : []).map(normalizeDocument);
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

  const direct = callState(
    ['getDocumentById', 'findDocumentById', 'getDocument'],
    documentId
  );

  if (direct) return normalizeDocument(direct);

  const fallback = listDocuments({}).find((doc) => doc.id === documentId);
  return fallback ? normalizeDocument(fallback) : null;
}

export function buildDocumentPayload(values = {}) {
  const lines = normalizeLines(values.lines ?? []);
  const totals = computeTotals(lines);

  return {
    id: values.id ?? '',
    number: values.number ?? '',
    type: values.type ?? 'transfer',
    status: values.status ?? 'draft',
    date: values.date ?? new Date().toISOString().slice(0, 10),
    reference: values.reference ?? '',
    notes: values.notes ?? '',
    origin: values.origin ?? '',
    destination: values.destination ?? '',
    lines,
    linesCount: totals.linesCount,
    grandTotal: totals.grandTotal,
  };
}

export function createDocument(values = {}) {
  const payload = buildDocumentPayload(values);
  return callState(['createDocument', 'addDocument'], payload);
}

export function updateDocument(documentId, values = {}) {
  const payload = buildDocumentPayload({ ...values, id: documentId });
  return callState(['updateDocument', 'editDocument'], documentId, payload);
}

export function saveDocument(values = {}) {
  if (values.id) {
    return updateDocument(values.id, values);
  }

  return createDocument(values);
}

export function postDocumentById(documentId) {
  return callState(['postDocument'], documentId);
}

export function cancelDocumentById(documentId, reason) {
  return callState(['cancelDocument'], documentId, reason);
}
