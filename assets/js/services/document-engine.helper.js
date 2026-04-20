export const DOCUMENT_TYPE_META = {
  stock_entry: { label: 'Entrada de stock', requiresOrigin: false, requiresDestination: true, checksStockOnOrigin: false },
  stock_exit: { label: 'Saída de stock', requiresOrigin: true, requiresDestination: false, checksStockOnOrigin: true },
  sale: { label: 'Venda', requiresOrigin: true, requiresDestination: false, checksStockOnOrigin: true },
  purchase: { label: 'Compra', requiresOrigin: false, requiresDestination: true, checksStockOnOrigin: false },
  stock_transfer: { label: 'Transferência de stock', requiresOrigin: true, requiresDestination: true, checksStockOnOrigin: true },
  stock_adjustment: { label: 'Ajuste de stock', requiresOrigin: false, requiresDestination: true, checksStockOnOrigin: false },
  stock_return: { label: 'Devolução de stock', requiresOrigin: false, requiresDestination: true, checksStockOnOrigin: false },
};

const TYPE_ALIAS_MAP = {
  transferencia: 'stock_transfer',
  'transferência': 'stock_transfer',
  ajuste: 'stock_adjustment',
  venda: 'sale',
  compra: 'purchase',
  purchase: 'purchase',
  sale: 'sale',
  stock_transfer: 'stock_transfer',
  stock_adjustment: 'stock_adjustment',
  stock_entry: 'stock_entry',
  stock_exit: 'stock_exit',
  stock_return: 'stock_return',
};

export function normalizeDocumentType(type = '') {
  const normalized = String(type || '').trim().toLowerCase();
  const resolved = TYPE_ALIAS_MAP[normalized];
  if (!resolved) {
    throw new Error(`Tipo de documento inválido: ${type || 'vazio'}.`);
  }
  return resolved;
}

export function getDocumentTypeOptions() {
  return Object.entries(DOCUMENT_TYPE_META).map(([value, meta]) => ({ value, label: meta.label }));
}

export function isValidDocumentType(type) {
  const normalized = String(type || '').trim().toLowerCase();
  const resolved = TYPE_ALIAS_MAP[normalized];
  return Boolean(resolved && DOCUMENT_TYPE_META[resolved]);
}
