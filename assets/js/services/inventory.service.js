import {
  getProducts,
  getWarehouses,
  getStockBalances,
  getStockMoves,
  getDocuments,
} from '../core/state.js';

function safeNumber(value, fallback = 0) {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
}

function normalizeText(value) {
  return String(value || '').trim().toLowerCase();
}

function getStockStatus(qtyAvailable) {
  const qty = safeNumber(qtyAvailable);

  if (qty <= 0) return 'out';
  if (qty <= 3) return 'low';
  return 'ok';
}

function formatReferenceLabel(move, documentsMap) {
  if (!move) return '—';

  if (move.reference_document_id && documentsMap.has(move.reference_document_id)) {
    const doc = documentsMap.get(move.reference_document_id);
    return doc.number || doc.code || doc.id || 'Documento';
  }

  if (move.reference_text) return move.reference_text;
  return '—';
}

function enrichBalanceRow(balance, productsMap, warehousesMap) {
  const product = productsMap.get(balance.product_id);
  const warehouse = warehousesMap.get(balance.warehouse_id);

  const qtyOnHand = safeNumber(balance.qty_on_hand);
  const qtyReserved = safeNumber(balance.qty_reserved);
  const qtyAvailable =
    balance.qty_available != null
      ? safeNumber(balance.qty_available)
      : qtyOnHand - qtyReserved;

  const avgUnitCost = safeNumber(balance.avg_unit_cost);
  const totalCost =
    balance.total_cost != null
      ? safeNumber(balance.total_cost)
      : qtyOnHand * avgUnitCost;

  const stockStatus = getStockStatus(qtyAvailable);

  return {
    ...balance,
    product_name: product?.name || 'Produto sem nome',
    product_sku: product?.sku || '—',
    warehouse_name: warehouse?.name || 'Armazém sem nome',
    qty_on_hand: qtyOnHand,
    qty_reserved: qtyReserved,
    qty_available: qtyAvailable,
    avg_unit_cost: avgUnitCost,
    total_cost: totalCost,
    stock_status: stockStatus,
  };
}

function enrichLedgerRow(move, productsMap, warehousesMap, documentsMap) {
  const product = productsMap.get(move.product_id);
  const warehouse = warehousesMap.get(move.warehouse_id);

  const qty = safeNumber(move.qty);
  const unitCost = safeNumber(move.unit_cost);
  const totalCost =
    move.total_cost != null ? safeNumber(move.total_cost) : qty * unitCost;

  return {
    ...move,
    product_name: product?.name || 'Produto sem nome',
    product_sku: product?.sku || '—',
    warehouse_name: warehouse?.name || 'Armazém sem nome',
    qty,
    unit_cost: unitCost,
    total_cost: totalCost,
    reference_label: formatReferenceLabel(move, documentsMap),
    reference_id: move.reference_document_id || '',
  };
}

function matchesText(row, query) {
  if (!query) return true;

  const q = normalizeText(query);

  return [
    row.product_name,
    row.product_sku,
    row.warehouse_name,
    row.reference_label,
    row.movement_type,
    row.move_type,
    row.direction,
  ]
    .filter(Boolean)
    .some((value) => normalizeText(value).includes(q));
}

export function getInventoryBalances() {
  const balances = getStockBalances?.() || [];
  const products = getProducts?.() || [];
  const warehouses = getWarehouses?.() || [];

  const productsMap = new Map(products.map((item) => [item.id, item]));
  const warehousesMap = new Map(warehouses.map((item) => [item.id, item]));

  return balances
    .map((balance) => enrichBalanceRow(balance, productsMap, warehousesMap))
    .sort((a, b) => {
      if (a.product_name < b.product_name) return -1;
      if (a.product_name > b.product_name) return 1;
      if (a.warehouse_name < b.warehouse_name) return -1;
      if (a.warehouse_name > b.warehouse_name) return 1;
      return 0;
    });
}

export function getInventoryLedger() {
  const stockMoves = getStockMoves?.() || [];
  const products = getProducts?.() || [];
  const warehouses = getWarehouses?.() || [];
  const documents = getDocuments?.() || [];

  const productsMap = new Map(products.map((item) => [item.id, item]));
  const warehousesMap = new Map(warehouses.map((item) => [item.id, item]));
  const documentsMap = new Map(documents.map((item) => [item.id, item]));

  return stockMoves
    .map((move) =>
      enrichLedgerRow(move, productsMap, warehousesMap, documentsMap)
    )
    .sort((a, b) => new Date(b.date) - new Date(a.date));
}

export function getInventoryBalanceSummary() {
  const balances = getInventoryBalances();

  const totalItems = balances.length;

  const totalQtyOnHand = balances.reduce(
    (sum, row) => sum + safeNumber(row.qty_on_hand),
    0
  );

  const totalQtyReserved = balances.reduce(
    (sum, row) => sum + safeNumber(row.qty_reserved),
    0
  );

  const totalQtyAvailable = balances.reduce(
    (sum, row) => sum + safeNumber(row.qty_available),
    0
  );

  const totalStockValue = balances.reduce(
    (sum, row) => sum + safeNumber(row.total_cost),
    0
  );

  const totalOutOfStock = balances.filter(
    (row) => row.stock_status === 'out'
  ).length;

  const totalLowStock = balances.filter(
    (row) => row.stock_status === 'low'
  ).length;

  return {
    total_items: totalItems,
    total_qty_on_hand: totalQtyOnHand,
    total_qty_reserved: totalQtyReserved,
    total_qty_available: totalQtyAvailable,
    total_stock_value: totalStockValue,
    total_out_of_stock: totalOutOfStock,
    total_low_stock: totalLowStock,
  };
}

export function getInventoryLedgerSummary() {
  const ledger = getInventoryLedger();

  const totalMoves = ledger.length;

  const totalIn = ledger
    .filter((row) => row.direction === 'in')
    .reduce((sum, row) => sum + safeNumber(row.qty), 0);

  const totalOut = ledger
    .filter((row) => row.direction === 'out')
    .reduce((sum, row) => sum + safeNumber(row.qty), 0);

  const totalValue = ledger.reduce(
    (sum, row) => sum + safeNumber(row.total_cost),
    0
  );

  return {
    total_moves: totalMoves,
    total_in: totalIn,
    total_out: totalOut,
    total_value: totalValue,
  };
}

export function searchInventoryBalances({
  query = '',
  warehouse = '',
  status = '',
  sortBy = 'product_asc',
} = {}) {
  let rows = [...getInventoryBalances()];

  if (query) {
    rows = rows.filter((row) => matchesText(row, query));
  }

  if (warehouse) {
    rows = rows.filter(
      (row) => normalizeText(row.warehouse_name) === normalizeText(warehouse)
    );
  }

  if (status) {
    rows = rows.filter(
      (row) => normalizeText(row.stock_status) === normalizeText(status)
    );
  }

  switch (sortBy) {
    case 'product_desc':
      rows.sort((a, b) => b.product_name.localeCompare(a.product_name));
      break;

    case 'warehouse_asc':
      rows.sort((a, b) => a.warehouse_name.localeCompare(b.warehouse_name));
      break;

    case 'warehouse_desc':
      rows.sort((a, b) => b.warehouse_name.localeCompare(a.warehouse_name));
      break;

    case 'qty_desc':
      rows.sort((a, b) => Number(b.qty_on_hand) - Number(a.qty_on_hand));
      break;

    case 'qty_asc':
      rows.sort((a, b) => Number(a.qty_on_hand) - Number(b.qty_on_hand));
      break;

    case 'value_desc':
      rows.sort((a, b) => Number(b.total_cost) - Number(a.total_cost));
      break;

    case 'value_asc':
      rows.sort((a, b) => Number(a.total_cost) - Number(b.total_cost));
      break;

    case 'product_asc':
    default:
      rows.sort((a, b) => a.product_name.localeCompare(b.product_name));
      break;
  }

  return rows;
}

export function searchInventoryLedger({
  query = '',
  warehouse = '',
  movementType = '',
  direction = '',
  sortBy = 'date_desc',
} = {}) {
  let rows = [...getInventoryLedger()];

  if (query) {
    rows = rows.filter((row) => matchesText(row, query));
  }

  if (warehouse) {
    rows = rows.filter(
      (row) => normalizeText(row.warehouse_name) === normalizeText(warehouse)
    );
  }

  if (movementType) {
    rows = rows.filter(
      (row) =>
        normalizeText(row.movement_type || row.move_type) ===
        normalizeText(movementType)
    );
  }

  if (direction) {
    rows = rows.filter(
      (row) => normalizeText(row.direction) === normalizeText(direction)
    );
  }

  switch (sortBy) {
    case 'date_asc':
      rows.sort((a, b) => new Date(a.date) - new Date(b.date));
      break;

    case 'product_asc':
      rows.sort((a, b) => a.product_name.localeCompare(b.product_name));
      break;

    case 'product_desc':
      rows.sort((a, b) => b.product_name.localeCompare(a.product_name));
      break;

    case 'qty_desc':
      rows.sort((a, b) => Number(b.qty) - Number(a.qty));
      break;

    case 'qty_asc':
      rows.sort((a, b) => Number(a.qty) - Number(b.qty));
      break;

    case 'value_desc':
      rows.sort((a, b) => Number(b.total_cost) - Number(a.total_cost));
      break;

    case 'value_asc':
      rows.sort((a, b) => Number(a.total_cost) - Number(b.total_cost));
      break;

    case 'date_desc':
    default:
      rows.sort((a, b) => new Date(b.date) - new Date(a.date));
      break;
  }

  return rows;
}

export function paginateInventoryRows(rows, page = 1, pageSize = 10) {
  const safePage = Math.max(1, Number(page) || 1);
  const safePageSize = Math.max(1, Number(pageSize) || 10);
  const totalItems = rows.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / safePageSize));
  const normalizedPage = Math.min(safePage, totalPages);

  const start = (normalizedPage - 1) * safePageSize;
  const end = start + safePageSize;

  return {
    items: rows.slice(start, end),
    pagination: {
      page: normalizedPage,
      pageSize: safePageSize,
      totalItems,
      totalPages,
    },
  };
}

export function getInventoryFilterOptions() {
  const balances = getInventoryBalances();
  const ledger = getInventoryLedger();

  const warehouseSet = new Set(
    [...balances, ...ledger].map((row) => row.warehouse_name).filter(Boolean)
  );

  const movementTypeSet = new Set(
    ledger.map((row) => row.movement_type || row.move_type).filter(Boolean)
  );

  return {
    warehouses: [...warehouseSet].sort((a, b) => a.localeCompare(b)),
    movementTypes: [...movementTypeSet].sort((a, b) => a.localeCompare(b)),
  };
}

export function getInventoryBalancesPageData({
  query = '',
  warehouse = '',
  status = '',
  sortBy = 'product_asc',
  page = 1,
  pageSize = 10,
} = {}) {
  const summary = getInventoryBalanceSummary();
  const options = getInventoryFilterOptions();

  const rows = searchInventoryBalances({
    query,
    warehouse,
    status,
    sortBy,
  });

  const { items, pagination } = paginateInventoryRows(rows, page, pageSize);

  return {
    summary,
    options,
    items,
    pagination,
  };
}
