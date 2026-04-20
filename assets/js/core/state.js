import { normalizeDocumentType, DOCUMENT_TYPE_META } from '../services/document-engine.helper.js';

const state = {
  products: [],
  warehouses: [],
  customers: [],
  suppliers: [],
  stockBalances: [],
  stockMoves: [],
  documents: [],
};

function normalizeText(value) {
  return String(value || '').trim().toLowerCase();
}

function toNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function resolveDocumentType(type = "") {
  return normalizeDocumentType(type);
}

function findProductById(productId) {
  return (state.products || []).find((product) => product.id === productId) || null;
}

function findProduct(value) {
  const lookup = normalizeText(value);
  return (state.products || []).find((product) => (
    normalizeText(product.id) === lookup
    || normalizeText(product.name) === lookup
    || normalizeText(product.sku) === lookup
  )) || null;
}

function findWarehouse(value) {
  if (!value) return null;
  const lookup = normalizeText(value);
  return (state.warehouses || []).find((warehouse) => (
    normalizeText(warehouse.id) === lookup || normalizeText(warehouse.name) === lookup
  )) || null;
}

function findCustomer(value) {
  if (!value) return null;
  const lookup = normalizeText(value);
  return (state.customers || []).find((customer) => (
    normalizeText(customer.id) === lookup
    || normalizeText(customer.code) === lookup
    || normalizeText(customer.name) === lookup
  )) || null;
}

function findSupplier(value) {
  if (!value) return null;
  const lookup = normalizeText(value);
  return (state.suppliers || []).find((supplier) => (
    normalizeText(supplier.id) === lookup
    || normalizeText(supplier.code) === lookup
    || normalizeText(supplier.name) === lookup
  )) || null;
}

function ensureStockStructures() {
  if (!Array.isArray(state.stockMoves)) state.stockMoves = [];
  if (!Array.isArray(state.stockBalances)) state.stockBalances = [];
}

function getStockBalanceByProductAndWarehouse(productId, warehouseId) {
  return state.stockBalances.find((item) => item.product_id === productId && item.warehouse_id === warehouseId) || null;
}

function getOrCreateStockBalance(productId, warehouseId) {
  ensureStockStructures();
  let balance = getStockBalanceByProductAndWarehouse(productId, warehouseId);
  if (!balance) {
    balance = {
      id: crypto.randomUUID(),
      product_id: productId,
      warehouse_id: warehouseId,
      qty_on_hand: 0,
      qty_reserved: 0,
      qty_available: 0,
      avg_unit_cost: 0,
      total_cost: 0,
    };
    state.stockBalances.push(balance);
  }
  return balance;
}

function recalculateBalance(balance) {
  balance.qty_available = toNumber(balance.qty_on_hand) - toNumber(balance.qty_reserved);
  balance.total_cost = toNumber(balance.qty_on_hand) * toNumber(balance.avg_unit_cost);
  return balance;
}

function getAvailableQty(productId, warehouseId) {
  const balance = getStockBalanceByProductAndWarehouse(productId, warehouseId);
  if (!balance) return 0;
  return toNumber(balance.qty_available ?? balance.qty_on_hand);
}

function calculateLineTotal(quantity, unitPrice) {
  return toNumber(quantity) * toNumber(unitPrice);
}

function createDocumentLine({ id, product_id = '', item, quantity, unitPrice }) {
  const product = product_id ? findProductById(product_id) : findProduct(item);
  const safeQty = toNumber(quantity);
  const safeUnitPrice = toNumber(unitPrice);

  return {
    id: id || crypto.randomUUID(),
    document_id: '',
    product_id: product?.id || product_id || '',
    item: product?.name || item || '',
    product_code: product?.sku || '',
    product_name: product?.name || item || '',
    quantity: safeQty,
    qty: safeQty,
    unitPrice: safeUnitPrice,
    unit_cost: safeUnitPrice,
    unit_price: safeUnitPrice,
    total: calculateLineTotal(safeQty, safeUnitPrice),
    line_total: calculateLineTotal(safeQty, safeUnitPrice),
    created_at: new Date().toISOString(),
  };
}

function recalculateDocumentTotals(document) {
  document.lines = (document.lines || []).map((line) => {
    const quantity = toNumber(line.quantity ?? line.qty);
    const unitPrice = toNumber(line.unitPrice ?? line.unit_cost ?? line.unit_price);
    const total = calculateLineTotal(quantity, unitPrice);
    return {
      ...line,
      quantity,
      qty: quantity,
      unitPrice,
      unit_cost: unitPrice,
      unit_price: unitPrice,
      total,
      line_total: total,
    };
  });

  document.totals = {
    linesCount: document.lines.length,
    grandTotal: document.lines.reduce((sum, line) => sum + toNumber(line.total), 0),
  };

  return document.totals;
}

function resolveLineProduct(line) {
  if (!line) return null;
  if (line.product_id) {
    const byId = findProductById(line.product_id);
    if (byId) return byId;
  }
  return findProduct(line.item || line.product_name);
}

function validateDocumentLines(document) {
  if (!Array.isArray(document.lines) || !document.lines.length) {
    throw new Error('Não é possível postar um documento sem linhas.');
  }

  document.lines.forEach((line, index) => {
    const row = index + 1;
    if (!line.product_id) {
      throw new Error(`Linha ${row}: product_id obrigatório.`);
    }

    const qty = toNumber(line.quantity ?? line.qty, NaN);
    if (!Number.isFinite(qty) || qty <= 0) {
      throw new Error(`Linha ${row}: quantidade inválida.`);
    }
  });
}

function validateDocumentWarehouses(document) {
  const type = resolveDocumentType(document.type);
  const typeMeta = DOCUMENT_TYPE_META[type] || DOCUMENT_TYPE_META.stock_transfer;
  const originWarehouse = findWarehouse(document.origin);
  const destinationWarehouse = findWarehouse(document.destination);

  if (typeMeta.requiresOrigin && !originWarehouse) {
    throw new Error(`Armazém de origem não encontrado: ${document.origin}`);
  }

  if (typeMeta.requiresDestination && !destinationWarehouse) {
    throw new Error(`Armazém de destino não encontrado: ${document.destination}`);
  }

  if (type === 'stock_transfer' && originWarehouse && destinationWarehouse && originWarehouse.id === destinationWarehouse.id) {
    throw new Error('A transferência exige armazéns de origem e destino diferentes.');
  }
}

function validateDocumentStock(document) {
  const type = resolveDocumentType(document.type);
  const typeMeta = DOCUMENT_TYPE_META[type] || DOCUMENT_TYPE_META.stock_transfer;
  if (!typeMeta.checksStockOnOrigin) return;

  const originWarehouse = findWarehouse(document.origin);
  if (!originWarehouse) throw new Error(`Armazém de origem não encontrado: ${document.origin}`);

  document.lines.forEach((line, index) => {
    const row = index + 1;
    const product = resolveLineProduct(line) || {
      id: line.product_id,
      name: line.product_name || line.item || `Produto ${row}`,
    };

    const requestedQty = toNumber(line.quantity ?? line.qty);
    const availableQty = getAvailableQty(product.id, originWarehouse.id);
    if (requestedQty > availableQty) {
      throw new Error(`Stock insuficiente para ${product.name} no armazém ${originWarehouse.name}. Disponível: ${availableQty}, solicitado: ${requestedQty}.`);
    }
  });
}

function validateDocumentBeforePosting(document) {
  if (!document) throw new Error('Documento não encontrado.');
  if (document.status !== 'draft') throw new Error('Apenas documentos em draft podem ser postados.');
  if (resolveDocumentType(document.type) === 'sale' && !document.customer_id) {
    throw new Error('Cliente obrigatório para postar venda.');
  }
  if (resolveDocumentType(document.type) === 'purchase' && !document.supplier_id) {
    throw new Error('Fornecedor obrigatório para postar compra.');
  }
  validateDocumentLines(document);
  validateDocumentWarehouses(document);
  validateDocumentStock(document);
}

function createStockMove({ documentId, date, movementType, direction, productId, warehouseId, qty, unitCost, referenceText = '', isReversal = false }) {
  ensureStockStructures();

  const safeQty = toNumber(qty);
  const safeUnitCost = toNumber(unitCost);
  const balance = getOrCreateStockBalance(productId, warehouseId);

  if (direction === 'out') {
    const currentQty = toNumber(balance.qty_on_hand);
    const nextQty = currentQty - safeQty;
    if (nextQty < 0) throw new Error('Operação bloqueada: o movimento deixaria o stock negativo.');
    balance.qty_on_hand = nextQty;
  }

  if (direction === 'in') {
    const currentQty = toNumber(balance.qty_on_hand);
    const currentAvg = toNumber(balance.avg_unit_cost);
    const nextQty = currentQty + safeQty;
    balance.avg_unit_cost = nextQty > 0
      ? ((currentQty * currentAvg) + (safeQty * safeUnitCost)) / nextQty
      : safeUnitCost;
    balance.qty_on_hand = nextQty;
  }

  recalculateBalance(balance);

  const move = {
    id: crypto.randomUUID(),
    date: date || new Date().toISOString(),
    movement_type: movementType,
    direction,
    product_id: productId,
    warehouse_id: warehouseId,
    qty: safeQty,
    unit_cost: safeUnitCost,
    total_cost: safeQty * safeUnitCost,
    reference_document_id: documentId || null,
    reference_text: referenceText || '',
    is_reversal: Boolean(isReversal),
  };

  state.stockMoves.push(move);
  return move;
}

function createStockMovesFromDocument(document, { isReversal = false } = {}) {
  const type = resolveDocumentType(document.type);
  const originWarehouse = findWarehouse(document.origin);
  const destinationWarehouse = findWarehouse(document.destination);
  const movementDate = isReversal ? new Date().toISOString() : (document.postedAt || new Date().toISOString());

  document.lines.forEach((line) => {
    const product = resolveLineProduct(line) || {
      id: line.product_id,
      name: line.product_name || line.item || 'Produto',
    };
    if (!product.id) throw new Error('Produto inválido na linha do documento.');

    const qty = toNumber(line.quantity ?? line.qty);
    const unitCost = toNumber(line.unitPrice ?? line.unit_cost ?? line.unit_price);
    const referenceText = `${isReversal ? 'Reversão' : 'Documento'} ${document.number}`;

    if (type === 'stock_transfer') {
      createStockMove({ documentId: document.id, date: movementDate, movementType: isReversal ? 'transfer_reversal_in' : 'transfer_out', direction: isReversal ? 'in' : 'out', productId: product.id, warehouseId: originWarehouse.id, qty, unitCost, referenceText, isReversal });
      createStockMove({ documentId: document.id, date: movementDate, movementType: isReversal ? 'transfer_reversal_out' : 'transfer_in', direction: isReversal ? 'out' : 'in', productId: product.id, warehouseId: destinationWarehouse.id, qty, unitCost, referenceText, isReversal });
      return;
    }

    if (type === 'stock_entry') {
      createStockMove({ documentId: document.id, date: movementDate, movementType: isReversal ? 'entry_reversal_out' : 'entry_in', direction: isReversal ? 'out' : 'in', productId: product.id, warehouseId: destinationWarehouse.id, qty, unitCost, referenceText, isReversal });
      return;
    }

    if (type === 'stock_exit') {
      createStockMove({ documentId: document.id, date: movementDate, movementType: isReversal ? 'exit_reversal_in' : 'exit_out', direction: isReversal ? 'in' : 'out', productId: product.id, warehouseId: originWarehouse.id, qty, unitCost, referenceText, isReversal });
      return;
    }

    if (type === 'sale') {
      createStockMove({ documentId: document.id, date: movementDate, movementType: isReversal ? 'sale_reversal_in' : 'sale_out', direction: isReversal ? 'in' : 'out', productId: product.id, warehouseId: originWarehouse.id, qty, unitCost, referenceText, isReversal });
      return;
    }

    if (type === 'purchase') {
      createStockMove({ documentId: document.id, date: movementDate, movementType: isReversal ? 'purchase_reversal_out' : 'purchase_in', direction: isReversal ? 'out' : 'in', productId: product.id, warehouseId: destinationWarehouse.id, qty, unitCost, referenceText, isReversal });
      return;
    }

    if (type === 'stock_return') {
      createStockMove({ documentId: document.id, date: movementDate, movementType: isReversal ? 'return_reversal_out' : 'return_in', direction: isReversal ? 'out' : 'in', productId: product.id, warehouseId: destinationWarehouse.id, qty, unitCost, referenceText, isReversal });
      return;
    }

    // stock_adjustment
    createStockMove({ documentId: document.id, date: movementDate, movementType: isReversal ? 'adjustment_reversal_out' : 'adjustment_in', direction: isReversal ? 'out' : 'in', productId: product.id, warehouseId: destinationWarehouse.id, qty, unitCost, referenceText, isReversal });
  });
}

function getDraftDocumentOrThrow(documentId) {
  const document = getDocumentById(documentId);
  if (!document) throw new Error('Documento não encontrado.');
  if (document.status !== 'draft') throw new Error('Apenas documentos em draft podem ser alterados.');
  return document;
}

function generateDocumentNumber() {
  const nextNumber = state.documents.length + 1;
  return `DOC-${String(nextNumber).padStart(4, '0')}`;
}

function buildDocument(data = {}) {
  const customer = findCustomer(data.customer_id || data.customer_name);
  const supplier = findSupplier(data.supplier_id || data.supplier_name);
  return {
    id: data.id || crypto.randomUUID(),
    company_id: data.company_id || data.companyId || 'default-company',
    number: data.number || generateDocumentNumber(),
    date: data.date || new Date().toISOString().slice(0, 10),
    type: resolveDocumentType(data.type),
    status: data.status || 'draft',
    origin: data.origin || '',
    destination: data.destination || '',
    customer_id: data.customer_id || customer?.id || '',
    customer_name: data.customer_name || customer?.name || '',
    supplier_id: data.supplier_id || supplier?.id || '',
    supplier_name: data.supplier_name || supplier?.name || '',
    notes: data.notes || '',
    created_at: data.created_at || new Date().toISOString(),
    postedAt: data.postedAt || null,
    cancelledAt: data.cancelledAt || null,
    cancelReason: data.cancelReason || '',
    lines: [],
    totals: { linesCount: 0, grandTotal: 0 },
  };
}

export function getState() {
  return state;
}

export function getDocuments() {
  return [...state.documents];
}

export function searchDocuments({ query = '', status = '', sortBy = 'date_desc' } = {}) {
  let results = [...state.documents];
  const q = normalizeText(query);

  if (q) {
    results = results.filter((doc) => [doc.number, doc.type, doc.origin, doc.destination, doc.customer_name, doc.supplier_name, doc.notes].some((value) => normalizeText(value).includes(q)));
  }

  if (status) {
    results = results.filter((doc) => doc.status === status);
  }

  if (sortBy === 'date_asc') results.sort((a, b) => new Date(a.date) - new Date(b.date));
  else if (sortBy === 'number_asc') results.sort((a, b) => a.number.localeCompare(b.number));
  else if (sortBy === 'number_desc') results.sort((a, b) => b.number.localeCompare(a.number));
  else results.sort((a, b) => new Date(b.date) - new Date(a.date));

  return results;
}

export function getDocumentById(id) {
  return state.documents.find((document) => document.id === id) || null;
}

export function createDocument(data) {
  const newDocument = buildDocument(data);
  state.documents.unshift(newDocument);
  return newDocument;
}

export function updateDocument(id, data) {
  const document = getDraftDocumentOrThrow(id);

  document.company_id = data.company_id || data.companyId || document.company_id;
  document.date = data.date;
  document.type = resolveDocumentType(data.type);
  document.origin = data.origin || '';
  document.destination = data.destination || '';
  const customer = findCustomer(data.customer_id || data.customer_name || document.customer_id);
  const supplier = findSupplier(data.supplier_id || data.supplier_name || document.supplier_id);
  document.customer_id = data.customer_id || customer?.id || '';
  document.customer_name = customer?.name || data.customer_name || '';
  document.supplier_id = data.supplier_id || supplier?.id || '';
  document.supplier_name = supplier?.name || data.supplier_name || '';
  document.notes = data.notes || '';

  return document;
}

export function addDocumentLine(documentId, lineData) {
  const document = getDraftDocumentOrThrow(documentId);
  const newLine = createDocumentLine({
    product_id: lineData.product_id || '',
    item: lineData.item,
    quantity: toNumber(lineData.quantity),
    unitPrice: toNumber(lineData.unitPrice ?? lineData.unit_cost ?? lineData.unit_price),
  });

  newLine.document_id = document.id;
  document.lines.push(newLine);
  recalculateDocumentTotals(document);
  return newLine;
}

export function updateDocumentLine(documentId, lineId, lineData) {
  const document = getDraftDocumentOrThrow(documentId);
  const line = document.lines.find((entry) => entry.id === lineId);
  if (!line) throw new Error('Linha não encontrada.');

  const product = findProductById(lineData.product_id || line.product_id);
  line.product_id = product?.id || lineData.product_id || '';
  line.item = product?.name || lineData.item || '';
  line.product_code = product?.sku || '';
  line.product_name = product?.name || line.item;
  line.quantity = toNumber(lineData.quantity);
  line.qty = line.quantity;
  line.unitPrice = toNumber(lineData.unitPrice);
  line.unit_cost = line.unitPrice;
  line.unit_price = line.unitPrice;
  line.total = calculateLineTotal(line.quantity, line.unitPrice);
  line.line_total = line.total;

  recalculateDocumentTotals(document);
  return line;
}

export function removeDocumentLine(documentId, lineId) {
  const document = getDraftDocumentOrThrow(documentId);
  document.lines = document.lines.filter((entry) => entry.id !== lineId);
  recalculateDocumentTotals(document);
}

export function getDocumentLines(documentId) {
  const document = getDocumentById(documentId);
  return document ? [...document.lines] : [];
}

export function getDocumentTotals(documentId) {
  const document = getDocumentById(documentId);
  return document ? { ...document.totals } : { linesCount: 0, grandTotal: 0 };
}

export function postDocument(documentId) {
  const document = getDocumentById(documentId);
  validateDocumentBeforePosting(document);

  document.status = 'posted';
  document.postedAt = new Date().toISOString();
  createStockMovesFromDocument(document);

  return document;
}

export function cancelDocument(documentId, reason = '') {
  const document = getDocumentById(documentId);
  if (!document) throw new Error('Documento não encontrado.');
  if (document.status === 'cancelled') throw new Error('Documento já está cancelado.');
  if (document.status !== 'posted') throw new Error('Apenas documentos em posted podem ser cancelados.');

  document.status = 'cancelled';
  document.cancelledAt = new Date().toISOString();
  document.cancelReason = reason?.trim() || 'Sem motivo informado.';

  createStockMovesFromDocument(document, { isReversal: true });
  return document;
}

export function getProducts() {
  return state.products || [];
}

export function getWarehouses() {
  return state.warehouses || [];
}

export function getCustomers() {
  return state.customers || [];
}

export function getSuppliers() {
  return state.suppliers || [];
}

export function getStockBalances() {
  return state.stockBalances || [];
}

export function getStockMoves() {
  return state.stockMoves || [];
}
