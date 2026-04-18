import { getState } from '../core/state.js';

function formatNumber(value) {
  return Number(value || 0);
}

/* =========================
   LEDGER BASE
========================= */

export function getInventoryLedger() {
  const state = getState();

  const moves = state.stockMoves || [];

  return moves.map((move) => ({
    id: move.id,
    date: move.date,
    product_id: move.product_id,
    product_name: move.product_name,
    warehouse_name: move.warehouse_name,
    movement_type: move.movement_type,
    direction: move.direction,
    qty: formatNumber(move.qty),
    unit_cost: formatNumber(move.unit_cost),
    total_cost: formatNumber(move.total_cost),
    reference_id: move.reference_id,
    reference_label: move.reference_label,
  }));
}

/* =========================
   SUMMARY
========================= */

export function getInventoryLedgerSummary() {
  const ledger = getInventoryLedger();

  let total_moves = ledger.length;
  let total_in = 0;
  let total_out = 0;
  let total_value = 0;

  ledger.forEach((row) => {
    if (row.direction === 'in') {
      total_in += row.qty;
    }

    if (row.direction === 'out') {
      total_out += row.qty;
    }

    total_value += row.total_cost;
  });

  return {
    total_moves,
    total_in,
    total_out,
    total_value,
  };
}

/* =========================
   FILTER OPTIONS
========================= */

export function getInventoryFilterOptions() {
  const ledger = getInventoryLedger();

  const warehouses = new Set();
  const movementTypes = new Set();

  ledger.forEach((row) => {
    if (row.warehouse_name) {
      warehouses.add(row.warehouse_name);
    }

    if (row.movement_type) {
      movementTypes.add(row.movement_type);
    }
  });

  return {
    warehouses: Array.from(warehouses),
    movementTypes: Array.from(movementTypes),
  };
}

/* =========================
   SEARCH + FILTER
========================= */

export function searchInventoryLedger(filters = {}) {
  const ledger = getInventoryLedger();

  let results = [...ledger];

  if (filters.query) {
    const q = filters.query.toLowerCase();

    results = results.filter((row) =>
      [
        row.product_name,
        row.reference_label,
        row.movement_type,
      ]
        .join(' ')
        .toLowerCase()
        .includes(q)
    );
  }

  if (filters.warehouse) {
    results = results.filter(
      (row) => row.warehouse_name === filters.warehouse
    );
  }

  if (filters.movementType) {
    results = results.filter(
      (row) => row.movement_type === filters.movementType
    );
  }

  if (filters.direction) {
    results = results.filter(
      (row) => row.direction === filters.direction
    );
  }

  /* SORT */

  switch (filters.sortBy) {
    case 'date_asc':
      results.sort((a, b) => new Date(a.date) - new Date(b.date));
      break;

    case 'date_desc':
      results.sort((a, b) => new Date(b.date) - new Date(a.date));
      break;

    case 'product_asc':
      results.sort((a, b) =>
        a.product_name.localeCompare(b.product_name)
      );
      break;

    case 'product_desc':
      results.sort((a, b) =>
        b.product_name.localeCompare(a.product_name)
      );
      break;

    case 'qty_desc':
      results.sort((a, b) => b.qty - a.qty);
      break;

    case 'qty_asc':
      results.sort((a, b) => a.qty - b.qty);
      break;

    case 'value_desc':
      results.sort((a, b) => b.total_cost - a.total_cost);
      break;

    case 'value_asc':
      results.sort((a, b) => a.total_cost - b.total_cost);
      break;

    default:
      results.sort((a, b) => new Date(b.date) - new Date(a.date));
  }

  return results;
}

/* =========================
   PAGINATION
========================= */

export function paginateInventoryRows(rows, page = 1, pageSize = 10) {
  const total = rows.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const currentPage = Math.min(Math.max(page, 1), totalPages);

  const start = (currentPage - 1) * pageSize;
  const end = start + pageSize;

  return {
    items: rows.slice(start, end),
    pagination: {
      page: currentPage,
      totalPages,
      total,
    },
  };
}

/* =========================
   BALANCES (SIMPLES)
========================= */

export function getInventoryBalances() {
  const ledger = getInventoryLedger();

  const map = new Map();

  ledger.forEach((row) => {
    const key = `${row.product_id}-${row.warehouse_name}`;

    if (!map.has(key)) {
      map.set(key, {
        product_id: row.product_id,
        product_name: row.product_name,
        warehouse_name: row.warehouse_name,
        qty: 0,
        total_cost: 0,
      });
    }

    const item = map.get(key);

    if (row.direction === 'in') {
      item.qty += row.qty;
      item.total_cost += row.total_cost;
    }

    if (row.direction === 'out') {
      item.qty -= row.qty;
      item.total_cost -= row.total_cost;
    }
  });

  return Array.from(map.values()).map((item) => ({
    ...item,
    avg_cost: item.qty > 0 ? item.total_cost / item.qty : 0,
  }));
}
