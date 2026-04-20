import {
  getInventoryLedgerSummary,
  searchInventoryLedger,
  paginateInventoryRows,
  getInventoryFilterOptions,
} from '../../services/inventory.service.js';

import {
  getInventoryPageFilters,
  updateInventoryPageFilters,
  resetInventoryPageFilters,
} from './inventory-filters.js';

const PAGE_SIZE = 10;

function formatNumber(value) {
  return new Intl.NumberFormat('pt-PT').format(Number(value || 0));
}

function formatCurrency(value) {
  return new Intl.NumberFormat('pt-PT', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value || 0));
}

function escapeHtml(value) {
  return String(value || '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
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

function getMovementTypeLabel(type) {
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

  return labels[type] || type || '-';
}

function renderSummaryCards(summary) {
  return `
    <section class="documents-stats-grid">
      <article class="documents-stat-card">
        <span class="documents-stat-card__label">Movimentos</span>
        <strong class="documents-stat-card__value">${formatNumber(summary.total_moves)}</strong>
      </article>

      <article class="documents-stat-card">
        <span class="documents-stat-card__label">Qty In</span>
        <strong class="documents-stat-card__value">${formatNumber(summary.total_in)}</strong>
      </article>

      <article class="documents-stat-card">
        <span class="documents-stat-card__label">Qty Out</span>
        <strong class="documents-stat-card__value">${formatNumber(summary.total_out)}</strong>
      </article>

      <article class="documents-stat-card">
        <span class="documents-stat-card__label">Valor movimentado</span>
        <strong class="documents-stat-card__value">${formatCurrency(summary.total_value)}</strong>
      </article>
    </section>
  `;
}

function renderFilters(filters, options) {
  return `
    <div class="card toolbar-card">
      <form class="toolbar toolbar--filters" id="inventory-ledger-filters-form">
        <div class="toolbar__group toolbar__group--search">
          <label class="toolbar__label" for="inventory-ledger-query">Pesquisar</label>
          <input
            id="inventory-ledger-query"
            name="query"
            class="toolbar__input"
            type="text"
            placeholder="Produto (code ou name)"
            value="${escapeHtml(filters.query || '')}"
          />
        </div>

        <div class="toolbar__group">
          <label class="toolbar__label" for="inventory-ledger-movementType">Tipo movimento</label>
          <select
            id="inventory-ledger-movementType"
            name="movementType"
            class="toolbar__select"
          >
            <option value="">Todos</option>
            ${(options.movementTypes || [])
              .map(
                (item) => `
                  <option value="${escapeHtml(item)}" ${filters.movementType === item ? 'selected' : ''}>
                    ${escapeHtml(getMovementTypeLabel(item))}
                  </option>
                `
              )
              .join('')}
          </select>
        </div>

        <div class="toolbar__group toolbar__group--actions">
          <button type="submit" class="btn btn-primary">Aplicar</button>
          <button type="button" class="btn btn-secondary" data-action="reset-ledger-filters">Limpar</button>
        </div>
      </form>
    </div>
  `;
}

function renderLedgerTable(rows) {
  if (!rows.length) {
    return `
      <div class="card">
        <div class="card-body empty-state">
          <h2>Sem movimentos</h2>
          <p>Não existem movimentos de stock que correspondam aos filtros aplicados.</p>
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
              <th>Tipo movimento</th>
              <th>Qty In</th>
              <th>Qty Out</th>
              <th>Saldo</th>
            </tr>
          </thead>
          <tbody>
            ${rows
              .map(
                (row) => `
                  <tr class="ledger-row ledger-row--${escapeHtml(row.direction || '')}">
                    <td>${formatDate(row.date)}</td>
                    <td>
                      <strong>${escapeHtml(row.product_name)}</strong>
                      <div class="table-meta">${escapeHtml(row.product_code)}</div>
                    </td>
                    <td>${escapeHtml(getMovementTypeLabel(row.movement_type || row.move_type))}</td>
                    <td>${formatNumber(row.qty_in)}</td>
                    <td>${formatNumber(row.qty_out)}</td>
                    <td>${formatNumber(row.running_balance)}</td>
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

function renderPagination(pagination) {
  return `
    <div class="pagination">
      <button
        class="btn btn-secondary"
        type="button"
        data-action="ledger-page-prev"
        ${pagination.page <= 1 ? 'disabled' : ''}
      >
        Anterior
      </button>

      <div class="pagination-info">
        Página ${pagination.page} de ${pagination.totalPages}
      </div>

      <button
        class="btn btn-secondary"
        type="button"
        data-action="ledger-page-next"
        ${pagination.page >= pagination.totalPages ? 'disabled' : ''}
      >
        Próxima
      </button>
    </div>
  `;
}

function bindLedgerPageEvents(pagination) {
  const form = document.querySelector('#inventory-ledger-filters-form');
  const resetButton = document.querySelector('[data-action="reset-ledger-filters"]');
  const prevButton = document.querySelector('[data-action="ledger-page-prev"]');
  const nextButton = document.querySelector('[data-action="ledger-page-next"]');

  form?.addEventListener('submit', (event) => {
    event.preventDefault();

    const formData = new FormData(form);

    updateInventoryPageFilters({
      query: formData.get('query') || '',
      movementType: formData.get('movementType') || '',
      sortBy: 'date_desc',
      page: 1,
    });
  });

  resetButton?.addEventListener('click', () => {
    resetInventoryPageFilters(['query', 'movementType', 'sortBy', 'page']);
  });

  prevButton?.addEventListener('click', () => {
    if (pagination.page <= 1) return;

    updateInventoryPageFilters({
      page: pagination.page - 1,
    });
  });

  nextButton?.addEventListener('click', () => {
    if (pagination.page >= pagination.totalPages) return;

    updateInventoryPageFilters({
      page: pagination.page + 1,
    });
  });
}

export async function renderInventoryLedgerPage() {
  const appRoot = document.querySelector('#app');
  if (!appRoot) return;

  const filters = getInventoryPageFilters({
    query: '',
    movementType: '',
    sortBy: 'date_desc',
    page: 1,
  });

  const summary = getInventoryLedgerSummary();
  const options = getInventoryFilterOptions();

  const rows = searchInventoryLedger({
    query: filters.query,
    movementType: filters.movementType,
    sortBy: filters.sortBy || 'date_desc',
  });

  const { items, pagination } = paginateInventoryRows(rows, filters.page, PAGE_SIZE);

  appRoot.innerHTML = `
    <section class="page-shell inventory-ledger-page">
      <section class="page-header">
        <div>
          <h1>Inventory Ledger</h1>
          <p>Histórico de movimentos de stock (mais recente primeiro).</p>
        </div>
      </section>

      ${renderSummaryCards(summary)}
      ${renderFilters(filters, options)}
      ${renderLedgerTable(items)}
      ${renderPagination(pagination)}
    </section>
  `;

  bindLedgerPageEvents(pagination);
}
