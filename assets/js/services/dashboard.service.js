import { listDocuments } from './documents.service.js';
import { listProducts } from './products.service.js';
import {
  getInventoryBalanceSummary,
  getInventoryBalances,
  getInventoryLedger,
  syncInventoryProducts,
} from './inventory.service.js';

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function safeNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function isProductActive(product = {}) {
  if (product?.status) {
    return String(product.status).toLowerCase() === 'active';
  }

  if (typeof product?.is_active === 'boolean') {
    return product.is_active;
  }

  return true;
}

function pickDate(value) {
  if (!value) return 0;
  const timestamp = new Date(value).getTime();
  return Number.isFinite(timestamp) ? timestamp : 0;
}

function sumBy(items, mapper) {
  return safeArray(items).reduce((sum, item) => sum + safeNumber(mapper(item)), 0);
}

export async function getDashboardExecutiveData() {
  await syncInventoryProducts();

  const products = safeArray(await Promise.resolve(listProducts?.()));
  const documents = safeArray(listDocuments?.({}) || []);

  const inventorySummary = getInventoryBalanceSummary?.() || {
    total_items: 0,
    total_qty_on_hand: 0,
    total_qty_reserved: 0,
    total_qty_available: 0,
    total_stock_value: 0,
    total_out_of_stock: 0,
    total_low_stock: 0,
  };

  const inventoryBalances = safeArray(getInventoryBalances?.());
  const inventoryLedger = safeArray(getInventoryLedger?.());

  const postedSales = documents.filter((doc) => doc.type === 'sale' && doc.status === 'posted');
  const postedPurchases = documents.filter((doc) => doc.type === 'purchase' && doc.status === 'posted');

  const recentDocuments = [...documents]
    .sort((a, b) => pickDate(b.updatedAt || b.createdAt || b.date) - pickDate(a.updatedAt || a.createdAt || a.date))
    .slice(0, 6);

  const recentMoves = [...inventoryLedger]
    .sort((a, b) => pickDate(b.date) - pickDate(a.date))
    .slice(0, 8);

  const lowOrOutRows = inventoryBalances
    .filter((row) => row.stock_status === 'low' || row.stock_status === 'out')
    .sort((a, b) => safeNumber(a.qty_available) - safeNumber(b.qty_available))
    .slice(0, 6);

  const documentsByStatus = {
    total: documents.length,
    draft: documents.filter((doc) => doc.status === 'draft').length,
    posted: documents.filter((doc) => doc.status === 'posted').length,
    cancelled: documents.filter((doc) => doc.status === 'cancelled').length,
  };

  return {
    kpis: {
      activeProducts: products.filter(isProductActive).length,
      totalDocuments: documents.length,
      postedSales: postedSales.length,
      postedPurchases: postedPurchases.length,
      stockItems: safeNumber(inventorySummary.total_items),
      lowStockProducts: safeNumber(inventorySummary.total_low_stock),
      outOfStockProducts: safeNumber(inventorySummary.total_out_of_stock),
      totalStockValue: safeNumber(inventorySummary.total_stock_value),
    },
    documentsByStatus,
    recentDocuments,
    recentMoves,
    highlights: {
      lowOrOutRows,
      outOfStockProducts: safeNumber(inventorySummary.total_out_of_stock),
      lowStockProducts: safeNumber(inventorySummary.total_low_stock),
    },
    commerce: {
      postedSalesCount: postedSales.length,
      postedPurchasesCount: postedPurchases.length,
      postedSalesValue: sumBy(postedSales, (doc) => doc.grandTotal),
      postedPurchasesValue: sumBy(postedPurchases, (doc) => doc.grandTotal),
    },
  };
}
