const state = {
  products: [
    {
      id: 'p1',
      name: 'Produto A',
      sku: 'SKU-A',
    },
    {
      id: 'p2',
      name: 'Produto B',
      sku: 'SKU-B',
    },
    {
      id: 'p3',
      name: 'Produto C',
      sku: 'SKU-C',
    },
     {
    id: 'p4',
    name: 'TV RCD',
    sku: 'tvrcd',
  },
  ],

  warehouses: [
    {
      id: 'w1',
      name: 'Armazém Central',
    },
    {
      id: 'w2',
      name: 'Loja 1',
    },
    {
      id: 'w3',
      name: 'Stock Interno',
    },
  ],

  stockBalances: [
    {
      id: 'sb1',
      product_id: 'p1',
      warehouse_id: 'w1',
      qty_on_hand: 12,
      qty_reserved: 2,
      qty_available: 10,
      avg_unit_cost: 1500,
      total_cost: 18000,
    },
    {
      id: 'sb2',
      product_id: 'p2',
      warehouse_id: 'w1',
      qty_on_hand: 8,
      qty_reserved: 1,
      qty_available: 7,
      avg_unit_cost: 2500,
      total_cost: 20000,
    },
    {
      id: 'sb3',
      product_id: 'p3',
      warehouse_id: 'w3',
      qty_on_hand: 3,
      qty_reserved: 0,
      qty_available: 3,
      avg_unit_cost: 900,
      total_cost: 2700,
    },
  ],

  stockMoves: [
    {
      id: 'sm1',
      date: '2026-03-24T10:30:00',
      movement_type: 'adjustment_in',
      direction: 'in',
      product_id: 'p3',
      warehouse_id: 'w3',
      qty: 3,
      unit_cost: 900,
      total_cost: 2700,
      reference_document_id: null,
      reference_text: 'Ajuste inicial',
    },
    {
      id: 'sm2',
      date: '2026-03-25T09:00:00',
      movement_type: 'transfer_out',
      direction: 'out',
      product_id: 'p1',
      warehouse_id: 'w1',
      qty: 2,
      unit_cost: 1500,
      total_cost: 3000,
      reference_text: 'Transferência interna',
    },
    {
      id: 'sm3',
      date: '2026-03-25T09:05:00',
      movement_type: 'transfer_in',
      direction: 'in',
      product_id: 'p1',
      warehouse_id: 'w2',
      qty: 2,
      unit_cost: 1500,
      total_cost: 3000,
      reference_text: 'Recepção da transferência',
    },
  ],

  documents: [
    {
      id: crypto.randomUUID(),
      number: 'DOC-0001',
      date: '2026-03-25',
      type: 'Transferência',
      origin: 'Armazém Central',
      destination: 'Loja 1',
      status: 'draft',
      lines: [
        createDocumentLine({
          item: 'Produto A',
          quantity: 2,
          unitPrice: 1500,
        }),
        createDocumentLine({
          item: 'Produto B',
          quantity: 1,
          unitPrice: 2500,
        }),
      ],
      totals: {
        linesCount: 2,
        grandTotal: 5500,
      },
      postedAt: null,
      cancelledAt: null,
      cancelReason: '',
    },
    {
      id: crypto.randomUUID(),
      number: 'DOC-0002',
      date: '2026-03-24',
      type: 'Ajuste',
      origin: 'Armazém Central',
      destination: 'Stock Interno',
      status: 'posted',
      lines: [
        createDocumentLine({
          item: 'Produto C',
          quantity: 3,
          unitPrice: 900,
        }),
      ],
      totals: {
        linesCount: 1,
        grandTotal: 2700,
      },
      postedAt: '2026-03-24T10:30:00',
      cancelledAt: null,
      cancelReason: '',
    },
  ],
};

function findProductById(productId) {
  return (
    (state.products || []).find(
      (product) => product.id === productId
    ) || null
  );
}

// ==============================
// HELPERS (NÃO EXPORTADOS)
// ==============================

function normalizeText(value) {
  return String(value || '').trim().toLowerCase();
}

function findWarehouseByName(name) {
  return (
    (state.warehouses || []).find(
      (warehouse) => normalizeText(warehouse.name) === normalizeText(name)
    ) || null
  );
}

function findProduct(value) {
  const lookup = normalizeText(value);

  if (!lookup) return null;

  return (
    (state.products || []).find((product) => {
      return (
        normalizeText(product.id) === lookup ||
        normalizeText(product.name) === lookup ||
        normalizeText(product.sku) === lookup
      );
    }) || null
  );
}

function resolveLineProduct(line) {
  if (!line) return null;

  if (line.product_id) {
    const productById = findProductById(line.product_id);
    if (productById) return productById;
  }

  return findProduct(line.item);
}

function ensureStockStructures() {
  if (!Array.isArray(state.stockMoves)) {
    state.stockMoves = [];
  }

  if (!Array.isArray(state.stockBalances)) {
    state.stockBalances = [];
  }
}

function getStockBalanceByProductAndWarehouse(productId, warehouseId) {
  return (
    state.stockBalances.find(
      (item) => item.product_id === productId && item.warehouse_id === warehouseId
    ) || null
  );
}

function getAvailableQty(productId, warehouseId) {
  const balance = getStockBalanceByProductAndWarehouse(productId, warehouseId);

  if (!balance) return 0;

  return Number(balance.qty_available ?? balance.qty_on_hand ?? 0);
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
  balance.qty_available =
    Number(balance.qty_on_hand || 0) - Number(balance.qty_reserved || 0);

  balance.total_cost =
    Number(balance.qty_on_hand || 0) * Number(balance.avg_unit_cost || 0);

  return balance;
}

function validateDocumentLines(document) {
  if (!document.lines || !Array.isArray(document.lines) || !document.lines.length) {
    throw new Error('Não é possível postar um documento sem linhas.');
  }

  document.lines.forEach((line, index) => {
    const rowNumber = index + 1;

    if (!line.item || !String(line.item).trim()) {
      throw new Error(`A linha ${rowNumber} não tem produto definido.`);
    }

    const qty = Number(line.quantity);
    if (!Number.isFinite(qty) || qty <= 0) {
      throw new Error(`A linha ${rowNumber} tem quantidade inválida.`);
    }

    const unitPrice = Number(line.unitPrice);
    if (!Number.isFinite(unitPrice) || unitPrice < 0) {
      throw new Error(`A linha ${rowNumber} tem custo/preço unitário inválido.`);
    }

  const product = resolveLineProduct(line);
    if (!product) {
      throw new Error(`Produto não encontrado na linha ${rowNumber}: ${line.item}`);
    }
  });
}

function validateDocumentWarehouses(document) {
  if (document.type === 'Transferência') {
    const originWarehouse = findWarehouseByName(document.origin);
    const destinationWarehouse = findWarehouseByName(document.destination);

    if (!originWarehouse) {
      throw new Error(`Armazém de origem não encontrado: ${document.origin}`);
    }

    if (!destinationWarehouse) {
      throw new Error(`Armazém de destino não encontrado: ${document.destination}`);
    }

    if (originWarehouse.id === destinationWarehouse.id) {
      throw new Error('A transferência exige armazéns de origem e destino diferentes.');
    }
  }

  if (document.type === 'Ajuste') {
    const destinationWarehouse = findWarehouseByName(document.destination);

    if (!destinationWarehouse) {
      throw new Error(`Armazém de destino não encontrado: ${document.destination}`);
    }
  }
}

function validateDocumentStock(document) {
  if (document.type !== 'Transferência') {
    return;
  }

  const originWarehouse = findWarehouseByName(document.origin);

  if (!originWarehouse) {
    throw new Error(`Armazém de origem não encontrado: ${document.origin}`);
  }

  document.lines.forEach((line, index) => {
    const rowNumber = index + 1;
  const product = resolveLineProduct(line);

    if (!product) {
      throw new Error(`Produto não encontrado na linha ${rowNumber}: ${line.item}`);
    }

    const requestedQty = Number(line.quantity) || 0;
    const availableQty = getAvailableQty(product.id, originWarehouse.id);

    if (requestedQty > availableQty) {
      throw new Error(
        `Stock insuficiente para ${product.name} no armazém ${originWarehouse.name}. Disponível: ${availableQty}, solicitado: ${requestedQty}.`
      );
    }
  });
}

function validateDocumentBeforePosting(document) {
  if (!document) {
    throw new Error('Documento não encontrado.');
  }

  if (document.status !== 'draft') {
    throw new Error('Apenas documentos em draft podem ser postados.');
  }

  validateDocumentLines(document);
  validateDocumentWarehouses(document);
  validateDocumentStock(document);
}

function createStockMove({
  documentId,
  date,
  movementType,
  direction,
  productId,
  warehouseId,
  qty,
  unitCost,
  referenceText = '',
  isReversal = false,
}) {
  ensureStockStructures();

  const safeQty = Number(qty) || 0;
  const safeUnitCost = Number(unitCost) || 0;

  const balance = getOrCreateStockBalance(productId, warehouseId);

  if (direction === 'out') {
    const currentQty = Number(balance.qty_on_hand || 0);
    const nextQty = currentQty - safeQty;

    if (nextQty < 0) {
      throw new Error('Operação bloqueada: o movimento deixaria o stock negativo.');
    }

    balance.qty_on_hand = nextQty;
  } else if (direction === 'in') {
    const currentQty = Number(balance.qty_on_hand || 0);
    const currentAvg = Number(balance.avg_unit_cost || 0);
    const nextQty = currentQty + safeQty;

    if (nextQty > 0) {
      balance.avg_unit_cost =
        ((currentQty * currentAvg) + (safeQty * safeUnitCost)) / nextQty;
    } else {
      balance.avg_unit_cost = safeUnitCost;
    }

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
  if (!document) {
    throw new Error('Documento inválido para geração de movimentos.');
  }

  const originWarehouse = findWarehouseByName(document.origin);
  const destinationWarehouse = findWarehouseByName(document.destination);

  const movementDate = isReversal
    ? new Date().toISOString()
    : document.postedAt || new Date().toISOString();

  document.lines.forEach((line) => {
const product = resolveLineProduct(line);

    if (!product) {
      throw new Error(`Produto não encontrado para a linha: ${line.item}`);
    }

    const qty = Number(line.quantity) || 0;
    const unitCost = Number(line.unitPrice) || 0;

    if (document.type === 'Transferência') {
      if (!originWarehouse) {
        throw new Error(`Armazém de origem não encontrado: ${document.origin}`);
      }

      if (!destinationWarehouse) {
        throw new Error(`Armazém de destino não encontrado: ${document.destination}`);
      }

      if (!isReversal) {
        createStockMove({
          documentId: document.id,
          date: movementDate,
          movementType: 'transfer_out',
          direction: 'out',
          productId: product.id,
          warehouseId: originWarehouse.id,
          qty,
          unitCost,
          referenceText: `Transferência ${document.number}`,
        });

        createStockMove({
          documentId: document.id,
          date: movementDate,
          movementType: 'transfer_in',
          direction: 'in',
          productId: product.id,
          warehouseId: destinationWarehouse.id,
          qty,
          unitCost,
          referenceText: `Transferência ${document.number}`,
        });
      } else {
        createStockMove({
          documentId: document.id,
          date: movementDate,
          movementType: 'transfer_reversal_in',
          direction: 'in',
          productId: product.id,
          warehouseId: originWarehouse.id,
          qty,
          unitCost,
          referenceText: `Reversão ${document.number}`,
          isReversal: true,
        });

        createStockMove({
          documentId: document.id,
          date: movementDate,
          movementType: 'transfer_reversal_out',
          direction: 'out',
          productId: product.id,
          warehouseId: destinationWarehouse.id,
          qty,
          unitCost,
          referenceText: `Reversão ${document.number}`,
          isReversal: true,
        });
      }
    }

    if (document.type === 'Ajuste') {
      if (!destinationWarehouse) {
        throw new Error(`Armazém de destino não encontrado: ${document.destination}`);
      }

      if (!isReversal) {
        createStockMove({
          documentId: document.id,
          date: movementDate,
          movementType: 'adjustment_in',
          direction: 'in',
          productId: product.id,
          warehouseId: destinationWarehouse.id,
          qty,
          unitCost,
          referenceText: `Ajuste ${document.number}`,
        });
      } else {
        createStockMove({
          documentId: document.id,
          date: movementDate,
          movementType: 'adjustment_reversal_out',
          direction: 'out',
          productId: product.id,
          warehouseId: destinationWarehouse.id,
          qty,
          unitCost,
          referenceText: `Reversão ${document.number}`,
          isReversal: true,
        });
      }
    }
  });
}

function getProductLabel(product, fallback = '') {
  if (!product) return fallback || 'Produto desconhecido';
  return product.name || product.sku || product.id || fallback || 'Produto';
}

function getDraftDocumentOrThrow(documentId) {
  const document = getDocumentById(documentId);

  if (!document) {
    throw new Error('Documento não encontrado.');
  }

  if (document.status !== 'draft') {
    throw new Error('Apenas documentos em draft podem ser alterados.');
  }

  return document;
}

function createDocumentLine({ product_id = '', item, quantity, unitPrice }) {
  const safeQuantity = Number(quantity) || 0;
  const safeUnitPrice = Number(unitPrice) || 0;

  let resolvedItem = item || '';

  if (product_id) {
    const product = findProductById(product_id);
    if (product) {
      resolvedItem = product.name;
    }
  }

  return {
    id: crypto.randomUUID(),
    product_id,
    item: resolvedItem,
    quantity: safeQuantity,
    unitPrice: safeUnitPrice,
    total: calculateLineTotal(safeQuantity, safeUnitPrice),
  };
}

function calculateLineTotal(quantity, unitPrice) {
  return Number(quantity) * Number(unitPrice);
}

function recalculateDocumentTotals(document) {
  const linesCount = document.lines.length;
  const grandTotal = document.lines.reduce((sum, line) => {
    return sum + Number(line.total || 0);
  }, 0);

  document.totals = {
    linesCount,
    grandTotal,
  };

  return document.totals;
}

function generateDocumentNumber() {
  const nextNumber = state.documents.length + 1;
  return `DOC-${String(nextNumber).padStart(4, '0')}`;
}

// ==============================
// EXPORTS
// ==============================

export function getState() {
  return state;
}

export function getDocuments() {
  return [...state.documents];
}

export function searchDocuments({ query = '', status = '', sortBy = 'date_desc' } = {}) {
  let results = [...state.documents];

  if (query) {
    const q = query.toLowerCase();

    results = results.filter((documentData) =>
      documentData.number.toLowerCase().includes(q) ||
      documentData.type.toLowerCase().includes(q) ||
      (documentData.origin || '').toLowerCase().includes(q) ||
      (documentData.destination || '').toLowerCase().includes(q)
    );
  }

  if (status) {
    results = results.filter((documentData) => documentData.status === status);
  }

  switch (sortBy) {
    case 'date_desc':
      results.sort((a, b) => new Date(b.date) - new Date(a.date));
      break;

    case 'date_asc':
      results.sort((a, b) => new Date(a.date) - new Date(b.date));
      break;

    case 'number_asc':
      results.sort((a, b) => a.number.localeCompare(b.number));
      break;

    case 'number_desc':
      results.sort((a, b) => b.number.localeCompare(a.number));
      break;

    default:
      results.sort((a, b) => new Date(b.date) - new Date(a.date));
      break;
  }

  return results;
}

export function getDocumentById(id) {
  return state.documents.find((document) => document.id === id) || null;
}

export function createDocument(data) {
  const newDocument = {
    id: crypto.randomUUID(),
    number: generateDocumentNumber(),
    date: data.date,
    type: data.type,
    origin: data.origin,
    destination: data.destination,
    status: 'draft',
    lines: [],
    totals: {
      linesCount: 0,
      grandTotal: 0,
    },
    postedAt: null,
    cancelledAt: null,
    cancelReason: '',
  };

  state.documents.unshift(newDocument);
  return newDocument;
}

export function updateDocument(id, data) {
  const document = getDraftDocumentOrThrow(id);

  document.date = data.date;
  document.type = data.type;
  document.origin = data.origin;
  document.destination = data.destination;

  return document;
}

export function addDocumentLine(documentId, lineData) {
  const document = getDraftDocumentOrThrow(documentId);

const newLine = createDocumentLine({
  product_id: lineData.product_id || '',
  item: lineData.item,
  quantity: Number(lineData.quantity),
  unitPrice: Number(lineData.unitPrice),
});

  document.lines.push(newLine);
  recalculateDocumentTotals(document);

  return newLine;
}

export function updateDocumentLine(documentId, lineId, lineData) {
  const document = getDraftDocumentOrThrow(documentId);

  const line = document.lines.find((entry) => entry.id === lineId);

  if (!line) {
    throw new Error('Linha não encontrada.');
  }

line.product_id = lineData.product_id || '';

if (line.product_id) {
  const product = findProductById(line.product_id);
  line.item = product?.name || lineData.item || '';
} else {
  line.item = lineData.item || '';
}

line.quantity = Number(lineData.quantity);
line.unitPrice = Number(lineData.unitPrice);
line.total = calculateLineTotal(line.quantity, line.unitPrice);

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

  if (!document) return [];

  return [...document.lines];
}

export function getDocumentTotals(documentId) {
  const document = getDocumentById(documentId);

  if (!document) {
    return {
      linesCount: 0,
      grandTotal: 0,
    };
  }

  return { ...document.totals };
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

  if (!document) {
    throw new Error('Documento não encontrado.');
  }

  if (document.status !== 'posted') {
    throw new Error('Apenas documentos em posted podem ser cancelados.');
  }

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

export function getStockBalances() {
  return state.stockBalances || [];
}

export function getStockMoves() {
  return state.stockMoves || [];
}
