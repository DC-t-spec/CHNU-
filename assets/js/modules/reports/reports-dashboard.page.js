import {
  getInventoryBalanceSummary,
  getInventoryLedger,
  syncInventoryProducts,
} from '../../services/inventory.service.js';

import {
  escapeHtml,
  formatCurrency,
  formatDateTime,
  formatNumber,
  getMovementTypeLabel,
} from './reports-shared.js';

const DEFAULT_RECENT_MOVES_LIMIT = 10;

function renderKpiCards(summary) {
  return `
    <section class="documents-stats-grid reports-kpis-grid">
      <article class="documents-stat-card">
        <span class="documents-stat-card__label">Total produtos</span>
        <strong class="documents-stat-card__value">${formatNumber(summary.total_items)}</strong>
      </article>

      <article class="documents-stat-card">
        <span class="documents-stat-card__label">Produtos sem stock</span>
        <strong class="documents-stat-card__value">${formatNumber(summary.total_out_of_stock)}</strong>
      </article>

      <article class="documents-stat-card">
        <span class="documents-stat-card__label">Produtos com stock baixo</span>
        <strong class="documents-stat-card__value">${formatNumber(summary.total_low_stock)}</strong>
      </article>

      <article class="documents-stat-card">
        <span class="documents-stat-card__label">Valor total de stock</span>
        <strong class="documents-stat-card__value">${formatCurrency(summary.total_stock_value)}</strong>
      </article>
    </section>
  `;
}

function renderRecentMovementsTable(rows) {
  if (!rows.length) {
    return `
      <div class="card">
        <div class="card-body empty-state">
          <h2>Sem movimentos recentes</h2>
          <p>Ainda não existem movimentos para apresentar.</p>
        </div>
      </div>
    `;
  }

  return `
    <div class="card">
      <div class="table-responsive">
        <table class="table reports-table">
          <thead>
            <tr>
              <th>Data</th>
              <th>Produto</th>
              <th>Tipo</th>
              <th>Direção</th>
              <th>Qtd</th>
            </tr>
          </thead>
          <tbody>
            ${rows
              .map(
                (row) => `
                  <tr>
                    <td>${formatDateTime(row.date)}</td>
                    <td>
                      <strong>${escapeHtml(row.product_name)}</strong>
                      <div class="table-meta">${escapeHtml(row.product_code)}</div>
                    </td>
                    <td>${escapeHtml(getMovementTypeLabel(row.movement_type || row.move_type))}</td>
                    <td>${escapeHtml(row.direction === 'in' ? 'Entrada' : 'Saída')}</td>
                    <td>${formatNumber(row.qty)}</td>
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

export async function renderReportsDashboardPage() {
  const appRoot = document.querySelector('#app');
  if (!appRoot) return;

  await syncInventoryProducts();

  const summary = getInventoryBalanceSummary();
  const recentMoves = getInventoryLedger()
    .slice()
    .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0))
    .slice(0, DEFAULT_RECENT_MOVES_LIMIT);

  appRoot.innerHTML = `
    <section class="page-shell reports-page reports-dashboard-page">
      <section class="page-header">
        <div>
          <h1>Reports Dashboard</h1>
          <p>Visão executiva de produtos e inventário.</p>
        </div>
      </section>

      ${renderKpiCards(summary)}

      <section class="section-card reports-section-card">
        <div class="section-header">
          <div>
            <h2>Últimos movimentos (${DEFAULT_RECENT_MOVES_LIMIT})</h2>
            <p>Movimentos de stock mais recentes do sistema.</p>
          </div>
        </div>

        ${renderRecentMovementsTable(recentMoves)}
      </section>
    </section>
  `;
}
