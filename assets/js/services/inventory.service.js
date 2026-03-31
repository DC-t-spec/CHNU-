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
  };
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

  return {
    total_items: totalItems,
    total_qty_on_hand: totalQtyOnHand,
    total_qty_reserved: totalQtyReserved,
    total_qty_available: totalQtyAvailable,
    total_stock_value: totalStockValue,
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
