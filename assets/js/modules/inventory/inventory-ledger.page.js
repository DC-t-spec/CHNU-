import {
  getInventoryLedger,
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

const PAGE_SIZE = 5;

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

function renderSummaryCards(summary) {
  return `
    <section class="documents-stats-grid">
      <article class="documents-stat-card">
        <span class="documents-stat-card__label">Movimentos</span>
        <strong class="documents-stat-card__value">${formatNumber(summary.total_moves)}</strong>
      </article>

      <article class="documents-stat-card">
        <span class="documents-stat-card__label">Entradas</span>
        <strong class="documents-stat-card__value">${formatNumber(summary.total_in)}</strong>
      </article>

      <article class="documents-stat-card">
        <span class="documents-stat-card__label">Saídas</span>
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
            placeholder="Produto, SKU, documento ou movimento"
            value="${filters.query || ''}"
          />
        </div>

        <div class="toolbar__group">
          <label class="toolbar__label" for="inventory-ledger-warehouse">Armazém</label>
          <select
            id="inventory-ledger-warehouse"
            name="warehouse"
            class="toolbar__select"
          >
            <option value="">Todos</option>
            ${options.warehouses
              .map(
                (item) => `
                  <option value="${item}" ${filters.warehouse === item ? 'selected' : ''}>${item}</option>
                `
              )
              .join('')}
          </select>
        </div>

        <div class="toolbar__group">
          <label class="toolbar__label" for="inventory-ledger-movementType">Movimento</label>
          <select
            id="inventory-ledger-movementType"
            name="movementType"
            class="toolbar__select"
          >
            <option value="">Todos</option>
            ${options.movementTypes
              .map(
                (item) => `
                  <option value="${item}" ${filters.movementType === item ? 'selected' : ''}>${item}</option>
                `
              )
              .join('')}
          </select>
        </div>

        <div class="toolbar__group">
          <label class="toolbar__label" for="inventory-ledger-direction">Direcção</label>
          <select
            id="inventory-ledger-direction"
            name="direction"
            class="toolbar__select"
          >
            <option value="">Todas</option>
            <option value="in" ${filters.direction === 'in' ? 'selected' : ''}>Entrada</option>
            <option value="out" ${filters.direction === 'out' ? 'selected' : ''}>Saída</option>
          </select>
        </div>

        <div class="toolbar__group">
          <label class="toolbar__label" for="inventory-ledger-sort">Ordenar</label>
          <select
            id="inventory-ledger-sort"
            name="sortBy"
            class="toolbar__select"
          >
            <option value="date_desc" ${filters.sortBy === 'date_desc' ? 'selected' : ''}>Mais recente</option>
            <option value="date_asc" ${filters.sortBy === 'date_asc' ? 'selected' : ''}>Mais antigo</option>
            <option value="product_asc" ${filters.sortBy === 'product_asc' ? 'selected' : ''}>Produto A-Z</option>
            <option value="product_desc" ${filters.sortBy === 'product_desc' ? 'selected' : ''}>Produto Z-A</option>
            <option value="qty_desc" ${filters.sortBy === 'qty_desc' ? 'selected' : ''}>Maior qty</option>
            <option value="qty_asc" ${filters.sortBy === 'qty_asc' ? 'selected' : ''}>Menor qty</option>
            <option value="value_desc" ${filters.sortBy === 'value_desc' ? 'selected' : ''}>Maior valor</option>
            <option value="value_asc" ${filters.sortBy === 'value_asc' ? 'selected' : ''}>Menor valor</option>
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
                    <td>${row.reference_label || '-'}</td>
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
      warehouse: formData.get('warehouse') || '',
      movementType: formData.get('movementType') || '',
      direction: formData.get('direction') || '',
      sortBy: formData.get('sortBy') || 'date_desc',
      page: 1,
    });
  });

  resetButton?.addEventListener('click', () => {
    resetInventoryPageFilters([
      'query',
      'warehouse',
      'movementType',
      'direction',
      'sortBy',
      'page',
    ]);
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
    sortBy: 'date_desc',
    page: 1,
  });

  const summary = getInventoryLedgerSummary();
  const options = getInventoryFilterOptions();

  const rows = searchInventoryLedger({
    query: filters.query,
    warehouse: filters.warehouse,
    movementType: filters.movementType,
    direction: filters.direction,
    sortBy: filters.sortBy,
  });

  const { items, pagination } = paginateInventoryRows(rows, filters.page, PAGE_SIZE);

  appRoot.innerHTML = `
    <section class="page-shell inventory-ledger-page">
      <section class="page-header">
        <div>
          <h1>Inventory Ledger</h1>
          <p>Histórico completo dos movimentos de stock por produto e armazém.</p>
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
