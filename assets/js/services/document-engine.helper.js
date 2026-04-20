export const DOCUMENT_TYPE_META = {
  stock_entry: { label: 'Entrada de stock', requiresOrigin: false, requiresDestination: true, checksStockOnOrigin: false },
  stock_exit: { label: 'Saída de stock', requiresOrigin: true, requiresDestination: false, checksStockOnOrigin: true },
  stock_transfer: { label: 'Transferência de stock', requiresOrigin: true, requiresDestination: true, checksStockOnOrigin: true },
  stock_adjustment: { label: 'Ajuste de stock', requiresOrigin: false, requiresDestination: true, checksStockOnOrigin: false },
  stock_return: { label: 'Devolução de stock', requiresOrigin: false, requiresDestination: true, checksStockOnOrigin: false },
};

const TYPE_ALIAS_MAP = {
  transferencia: 'stock_transfer',
  'transferência': 'stock_transfer',
  ajuste: 'stock_adjustment',
  stock_transfer: 'stock_transfer',
  stock_adjustment: 'stock_adjustment',
  stock_entry: 'stock_entry',
  stock_exit: 'stock_exit',
  stock_return: 'stock_return',
};

export function normalizeDocumentType(type = '') {
  const normalized = String(type || '').trim().toLowerCase();
  return TYPE_ALIAS_MAP[normalized] || 'stock_transfer';
}

export function getDocumentTypeOptions() {
  return Object.entries(DOCUMENT_TYPE_META).map(([value, meta]) => ({ value, label: meta.label }));
}

export function isValidDocumentType(type) {
  return Boolean(DOCUMENT_TYPE_META[normalizeDocumentType(type)]);
}
