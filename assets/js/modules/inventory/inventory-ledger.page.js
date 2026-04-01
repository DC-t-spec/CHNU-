import {
  getStockMoves,
  getProducts,
  getWarehouses,
} from '../../core/state.js';

function formatNumber(value) {
  return new Intl.NumberFormat('pt-PT').format(Number(value || 0));
}

function formatCurrency(value) {
  return new Intl.NumberFormat('pt-PT', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value || 0));
}

function formatDate(value) {
  if (!value) return '-';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('pt-PT', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(date);
}

function getDirectionBadge(direction) {
  if (direction === 'in') {
    return `<span class="status-pill status-pill--success">Entrada</span>`;
  }

  if (direction === 'out') {
    return `<span class="status-pill status-pill--danger">Saída</span>`;
  }

  return `<span class="status-pill">-</span>`;
}

function getMovementTypeLabel(type) {
  const labels = {
    transfer_out: 'Transferência saída',
    transfer_in: 'Transferência entrada',
    transfer_reversal_in: 'Reversão entrada',
    transfer_reversal_out: 'Reversão saída',
    adjustment_in: 'Ajuste entrada',
    adjustment_reversal_out: 'Reversão ajuste',
  };

  return labels[type] || type || '-';
}

function enrichMoves(moves, products, warehouses) {
  return moves.map((move) => {
    const product = products.find((item) => item.id === move.product_id);
    const warehouse = warehouses.find((item) => item.id === move.warehouse_id);

    return {
      ...move,
      product_name: product?.name || 'Produto desconhecido',
      warehouse_name: warehouse?.name || 'Armazém desconhecido',
    };
  });
}

function renderLedgerSummary(rows) {
  const totalMoves = rows.length;
  const totalEntries = rows.filter((row) => row.direction === 'in').length;
  const totalExits = rows.filter((row) => row.direction === 'out').length;
  const movedQty = rows.reduce((sum, row) => sum + Number(row.qty || 0), 0);
  const movedValue = rows.reduce((sum, row) => sum + Number(row.total_cost || 0), 0);

  return `
    <section class="documents-stats-grid">
      <article class="documents-stat-card">
        <span class="documents-stat-card__label">Movimentos</span>
        <strong class="documents-stat-card__value">${formatNumber(totalMoves)}</strong>
      </article>

      <article class="documents-stat-card">
        <span class="documents-stat-card__label">Entradas</span>
        <strong class="documents-stat-card__value">${formatNumber(totalEntries)}</strong>
      </article>

      <article class="documents-stat-card">
        <span class="documents-stat-card__label">Saídas</span>
        <strong class="documents-stat-card__value">${formatNumber(totalExits)}</strong>
      </article>

      <article class="documents-stat-card">
        <span class="documents-stat-card__label">Qty movimentada</span>
        <strong class="documents-stat-card__value">${formatNumber(movedQty)}</strong>
      </article>

      <article class="documents-stat-card">
        <span class="documents-stat-card__label">Valor movimentado</span>
        <strong class="documents-stat-card__value">${formatCurrency(movedValue)}</strong>
      </article>
    </section>
  `;
}

function renderLedgerTable(rows) {
  if (!rows.length) {
    return `
      <div class="card">
        <div class="card-body empty-state">
          <h2>Sem movimentos</h2>
          <p>Ainda não existem movimentos de stock registados.</p>
        </div>
      </div>
    `;
  }

  return `
    <div class="card">
      <div class="table-responsive">
        <table class="table">
          <thead>
            <tr>
              <th>Data</th>
              <th>Produto</th>
              <th>Armazém</th>
              <th>Tipo</th>
              <th>Direcção</th>
              <th>Quantidade</th>
              <th>Custo unitário</th>
              <th>Custo total</th>
              <th>Referência</th>
            </tr>
          </thead>
          <tbody>
            ${rows
              .map(
                (row) => `
                  <tr>
                    <td>${formatDate(row.date)}</td>
                    <td>${row.product_name}</td>
                    <td>${row.warehouse_name}</td>
                    <td>${getMovementTypeLabel(row.movement_type)}</td>
                    <td>${getDirectionBadge(row.direction)}</td>
                    <td>${formatNumber(row.qty)}</td>
                    <td>${formatCurrency(row.unit_cost)}</td>
                    <td>${formatCurrency(row.total_cost)}</td>
                    <td>${row.reference_text || '-'}</td>
                  </tr>
                `
              )
              .join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

export async function renderInventoryLedgerPage() {
  const appRoot = document.querySelector('#app');
  if (!appRoot) return;

  const stockMoves = getStockMoves();
  const products = getProducts();
  const warehouses = getWarehouses();

  const rows = enrichMoves(stockMoves, products, warehouses).sort(
    (a, b) => new Date(b.date) - new Date(a.date)
  );

  appRoot.innerHTML = `
    <section class="page-shell inventory-ledger-page">
      <section class="page-header">
        <div>
          <h1>Inventory Ledger</h1>
          <p>Histórico completo dos movimentos de stock por produto e armazém.</p>
        </div>
      </section>

      ${renderLedgerSummary(rows)}
      ${renderLedgerTable(rows)}
    </section>
  `;
}
