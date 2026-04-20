import * as state from '../core/state.js';
import { DOCUMENT_TYPE_META, normalizeDocumentType, getDocumentTypeOptions as getDocTypeOptionsHelper } from './document-engine.helper.js';

function hasStateMethod(name) {
  return typeof state[name] === 'function';
}

function callStateStrict(methodNames, ...args) {
  for (const name of methodNames) {
    if (hasStateMethod(name)) return state[name](...args);
  }
  throw new Error(`Método do state não encontrado: ${methodNames.join(' | ')}`);
}

function callStateLoose(methodNames, ...args) {
  for (const name of methodNames) {
    if (hasStateMethod(name)) return state[name](...args);
  }
  return null;
}

function toNumber(value, fallback = 0) {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
}

function normalizeType(type = '') {
  return normalizeDocumentType(type);
}

function normalizeLine(line = {}, index = 0) {
  const productId = line.product_id ?? line.productId ?? line.itemId ?? '';
  const quantity = toNumber(line.quantity ?? line.qty, 0);
  const unitCost = toNumber(line.unit_cost ?? line.unitPrice ?? line.unit_price, 0);

  return {
    id: line.id ?? `line-${index + 1}`,
    document_id: line.document_id ?? line.documentId ?? '',
    product_id: productId,
    product_code: line.product_code ?? line.itemCode ?? '',
    product_name: line.product_name ?? line.itemName ?? line.item ?? '',
    itemId: productId,
    itemCode: line.product_code ?? line.itemCode ?? '',
    itemName: line.product_name ?? line.itemName ?? line.item ?? '',
    description: line.description ?? '',
    qty: quantity,
    quantity,
    unit_cost: unitCost,
    unit_price: unitCost,
    unitPrice: unitCost,
    line_total: toNumber(line.line_total ?? line.total, quantity * unitCost),
    total: toNumber(line.line_total ?? line.total, quantity * unitCost),
    created_at: line.created_at ?? line.createdAt ?? null,
  };
}

function normalizeLines(lines = []) {
  return (Array.isArray(lines) ? lines : [])
    .map((line, index) => normalizeLine(line, index))
    .filter((line) => line.product_id || line.product_name || line.qty > 0);
}

function computeTotals(lines = []) {
  return {
    linesCount: lines.length,
    grandTotal: lines.reduce((sum, line) => sum + toNumber(line.line_total), 0),
  };
}

function normalizeDocument(doc = {}) {
  const lines = normalizeLines(doc.lines || []);
  const totals = computeTotals(lines);
  const type = normalizeType(doc.type);

  return {
    id: doc.id ?? '',
    company_id: doc.company_id ?? doc.companyId ?? 'default-company',
    number: doc.number ?? '',
    date: doc.date ?? new Date().toISOString().slice(0, 10),
    type,
    type_label: DOCUMENT_TYPE_META[type]?.label || type,
    status: doc.status ?? 'draft',
    reference: doc.reference ?? '',
    notes: doc.notes ?? '',
    origin: doc.origin ?? '',
    destination: doc.destination ?? '',
    customer_id: doc.customer_id ?? doc.customerId ?? '',
    customer_name: doc.customer_name ?? doc.customerName ?? '',
    supplier_id: doc.supplier_id ?? doc.supplierId ?? '',
    supplier_name: doc.supplier_name ?? doc.supplierName ?? '',
    postedAt: doc.postedAt ?? doc.posted_at ?? null,
    cancelledAt: doc.cancelledAt ?? doc.cancelled_at ?? null,
    cancelReason: doc.cancelReason ?? doc.cancel_reason ?? '',
    createdAt: doc.createdAt ?? doc.created_at ?? null,
    updatedAt: doc.updatedAt ?? doc.updated_at ?? null,
    lines,
    linesCount: doc.linesCount ?? doc.totals?.linesCount ?? totals.linesCount,
    grandTotal: toNumber(doc.grandTotal ?? doc.grand_total ?? doc.totals?.grandTotal, totals.grandTotal),
    totalQty: lines.reduce((sum, line) => sum + toNumber(line.qty), 0),
  };
}

function getWarehousesInternal() {
  const result = callStateLoose(['getWarehouses']) ?? [];
  return (Array.isArray(result) ? result : []).map((warehouse, index) => ({
    id: warehouse.id ?? `warehouse-${index + 1}`,
    code: warehouse.code ?? '',
    name: warehouse.name ?? warehouse.label ?? `Armazém ${index + 1}`,
  }));
}

function getSuppliersInternal() {
  const result = callStateLoose(['getSuppliers']) ?? [];
  return (Array.isArray(result) ? result : []).map((supplier, index) => ({
    id: supplier.id ?? `supplier-${index + 1}`,
    code: supplier.code ?? '',
    name: supplier.name ?? supplier.label ?? `Fornecedor ${index + 1}`,
  }));
}

function mapWarehouseName(value) {
  if (!value) return '';
  const warehouse = getWarehousesInternal().find((item) => item.id === value || item.name === value);
  return warehouse ? warehouse.name : value;
}

function validatePayload(values = {}, { isPosting = false } = {}) {
  if (!values.type) throw new Error('Tipo obrigatório.');
  if (!values.date) throw new Error('Data obrigatória.');

  const type = normalizeType(values.type);
  const lines = normalizeLines(values.lines || []);

  if (isPosting && lines.length === 0) throw new Error('Pelo menos 1 linha é obrigatória para postar.');

  lines.forEach((line, index) => {
    if (!line.product_id) throw new Error(`Linha ${index + 1}: product_id obrigatório.`);
    if (!Number.isFinite(line.qty) || line.qty <= 0) throw new Error(`Linha ${index + 1}: qty > 0 obrigatório.`);
    if (!Number.isFinite(line.unit_cost) || line.unit_cost <= 0) throw new Error(`Linha ${index + 1}: unit_cost > 0 obrigatório.`);
  });

  if (type === 'stock_transfer') {
    if (!values.origin) throw new Error('Origem obrigatória para transferência.');
    if (!values.destination) throw new Error('Destino obrigatório para transferência.');
    if (values.origin === values.destination) throw new Error('Origem e destino não podem ser iguais.');
  }

  if (['stock_entry', 'stock_adjustment', 'stock_return'].includes(type) && !values.destination) {
    throw new Error('Destino obrigatório para este tipo de documento.');
  }

  if (type === 'stock_exit' && !values.origin) {
    throw new Error('Origem obrigatória para saída de stock.');
  }

  if (type === 'sale') {
    if (!values.customer_id) throw new Error('Cliente obrigatório para venda.');
    if (!values.origin) throw new Error('Origem obrigatória para venda.');
  }

  if (type === 'purchase') {
    if (!values.supplier_id) throw new Error('Fornecedor obrigatório para compra.');
    if (!values.destination) throw new Error('Destino obrigatório para compra.');
    const supplierExists = getSuppliersInternal().some((supplier) => supplier.id === values.supplier_id);
    if (!supplierExists) throw new Error('Fornecedor inválido para compra.');
  }
}

function buildDocumentPayload(values = {}) {
  const type = normalizeType(values.type);
  const lines = normalizeLines(values.lines ?? []);
  const totals = computeTotals(lines);

  return {
    id: values.id ?? '',
    company_id: values.company_id ?? values.companyId ?? 'default-company',
    number: values.number ?? '',
    type,
    status: values.status ?? 'draft',
    date: values.date ?? new Date().toISOString().slice(0, 10),
    reference: values.reference ?? '',
    notes: values.notes ?? '',
    origin: mapWarehouseName(values.origin ?? ''),
    destination: mapWarehouseName(values.destination ?? ''),
    customer_id: values.customer_id ?? '',
    supplier_id: values.supplier_id ?? '',
    lines: lines.map((line) => ({
      id: line.id,
      product_id: line.product_id,
      quantity: line.qty,
      qty: line.qty,
      unitPrice: line.unit_cost,
      unit_cost: line.unit_cost,
      unit_price: line.unit_cost,
      line_total: line.line_total,
    })),
    linesCount: totals.linesCount,
    grandTotal: totals.grandTotal,
  };
}

export function getDocumentTypeOptions() {
  return getDocTypeOptionsHelper();
}

export function listDocuments(filters = {}) {
  const result = callStateLoose(['searchDocuments', 'getDocuments'], filters) ?? [];
  const docs = (Array.isArray(result) ? result : []).map(normalizeDocument);

  const query = String(filters.query ?? '').trim().toLowerCase();
  const status = filters.status ?? null;

  return docs.filter((doc) => {
    const matchStatus = status ? doc.status === status : true;
    const matchQuery = query
      ? [doc.number, doc.type_label, doc.reference, doc.origin, doc.destination, doc.customer_name, doc.notes]
        .concat(doc.supplier_name ? [doc.supplier_name] : [])
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
  const direct = callStateLoose(['getDocumentById'], documentId);
  if (direct) return normalizeDocument(direct);
  const fallback = listDocuments({}).find((doc) => doc.id === documentId);
  return fallback ? normalizeDocument(fallback) : null;
}

export function createDocument(values = {}) {
  validatePayload(values);
  const payload = buildDocumentPayload(values);
  const created = callStateStrict(['createDocument'], payload);
  if (!created || !created.id) throw new Error('O documento não foi gravado no state.');
  return normalizeDocument(created);
}

export function updateDocument(documentId, values = {}) {
  validatePayload(values);
  const payload = buildDocumentPayload({ ...values, id: documentId });
  const updated = callStateStrict(['updateDocument'], documentId, payload);
  if (!updated || !updated.id) throw new Error('O documento não foi actualizado no state.');
  return normalizeDocument(updated);
}

export function saveDocument(values = {}) {
  validatePayload(values);
  const payload = buildDocumentPayload(values);
  let document;

  if (payload.id) {
    const existing = getDocumentById(payload.id);
    if (!existing) throw new Error('Documento não encontrado.');
    if (existing.status === 'posted') throw new Error('Documento posted não pode ser editado como draft.');
    if (existing.status === 'cancelled') throw new Error('Documento cancelled não pode ser editado.');

    document = callStateStrict(['updateDocument'], payload.id, payload);
    document.lines = [];
  } else {
    document = callStateStrict(['createDocument'], payload);
  }

  payload.lines.forEach((line) => {
    callStateStrict(['addDocumentLine'], document.id, {
      product_id: line.product_id,
      quantity: line.qty ?? line.quantity,
      unitPrice: line.unit_cost ?? line.unitPrice,
    });
  });

  const fresh = callStateStrict(['getDocumentById'], document.id);
  return normalizeDocument(fresh);
}

export function postDocumentById(documentId) {
  const existing = getDocumentById(documentId);
  if (!existing) throw new Error('Documento não encontrado.');
  if (existing.status === 'cancelled') throw new Error('Documento cancelled não pode ser postado.');
  validatePayload(existing, { isPosting: true });
  return normalizeDocument(callStateStrict(['postDocument'], documentId));
}

export function cancelDocumentById(documentId, reason) {
  return normalizeDocument(callStateStrict(['cancelDocument'], documentId, reason));
}

export function getProducts() {
  const result = callStateLoose(['getProducts', 'getInventoryProducts']) ?? [];
  return (Array.isArray(result) ? result : []).map((product, index) => ({
    id: product.id ?? `product-${index + 1}`,
    code: product.code ?? product.sku ?? '',
    name: product.name ?? product.itemName ?? product.description ?? `Produto ${index + 1}`,
    unitPrice: toNumber(product.unitPrice ?? product.price ?? product.avgCost, 0),
  }));
}

export function getWarehouses() {
  return getWarehousesInternal();
}

export function getCustomers() {
  const result = callStateLoose(['getCustomers']) ?? [];
  return (Array.isArray(result) ? result : []).map((customer, index) => ({
    id: customer.id ?? `customer-${index + 1}`,
    code: customer.code ?? '',
    name: customer.name ?? customer.label ?? `Cliente ${index + 1}`,
  }));
}

export function getSuppliers() {
  return getSuppliersInternal();
}
