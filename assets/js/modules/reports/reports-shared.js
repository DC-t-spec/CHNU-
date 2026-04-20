function normalizeNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function formatNumber(value) {
  return new Intl.NumberFormat('pt-PT').format(normalizeNumber(value));
}

export function formatCurrency(value) {
  return new Intl.NumberFormat('pt-PT', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(normalizeNumber(value));
}

export function formatDateTime(value) {
  if (!value) return '—';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);

  return new Intl.DateTimeFormat('pt-PT', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(date);
}

export function escapeHtml(value) {
  return String(value || '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

export function getStockStatusLabel(status) {
  if (status === 'out') return 'Sem stock';
  if (status === 'low') return 'Stock baixo';
  return 'Normal';
}

export function getStockStatusBadge(status) {
  if (status === 'out') {
    return '<span class="status-pill status-pill--danger">Sem stock</span>';
  }

  if (status === 'low') {
    return '<span class="status-pill status-pill--warning">Stock baixo</span>';
  }

  return '<span class="status-pill status-pill--success">Normal</span>';
}

export function getMovementTypeLabel(type) {
  const labels = {
    transfer_out: 'Transferência saída',
    transfer_in: 'Transferência entrada',
    transfer_reversal_in: 'Reversão entrada',
    transfer_reversal_out: 'Reversão saída',
    adjustment_in: 'Ajuste entrada',
    adjustment_reversal_out: 'Reversão ajuste',
    sale: 'Venda',
    purchase: 'Compra',
    production_in: 'Produção entrada',
    production_out: 'Produção saída',
  };

  return labels[type] || type || '—';
}
