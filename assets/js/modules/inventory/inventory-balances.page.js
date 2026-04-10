import { getInventoryBalancesPageData } from '../../services/inventory.service.js';
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

function escapeHtml(value) {
  return String(value || '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function getStockStatusBadge(status) {
  if (status === 'out') {
    return `<span class="status-pill status-pill--danger">Sem stock</span>`;
  }

  if (status === 'low') {
    return `<span class="status-pill status-pill--warning">Stock baixo</span>`;
  }

  return `<span class="status-pill status-pill--success">Saudável</span>`;
}

function renderSummaryCards(summary) {
  return `
    <section class="documents-stats-grid">
      <article class="documents-stat-card">
        <span class="documents-stat-card__label">Itens em saldo</span>
        <strong class="documents-stat-card__value">${formatNumber(summary.total_items)}</strong>
      </article>

      <article class="documents-stat-card">
        <span class="documents-stat-card__label">Qty on hand</span>
        <strong class="documents-stat-card__value">${formatNumber(summary.total_qty_on_hand)}</strong>
      </article>

      <article class="documents-stat-card">
        <span class="documents-stat-card__label">Qty available</span>
        <strong class="documents-stat-card__value">${formatNumber(summary.total_qty_available)}</strong>
      </article>

      <article class="documents-stat-card">
        <span class="documents-stat-card__label">Valor total stock</span>
        <strong class="documents-stat-card__value">${formatCurrency(summary.total_stock_value)}</strong>
      </article>

      <article class="documents-stat-card">
        <span class="documents-stat-card__label">Sem stock</span>
        <strong class="documents-stat-card__value">${formatNumber(summary.total_out_of_stock)}</strong>
      </article>

      <article class="documents-stat-card">
        <span class="documents-stat-card__label">Stock baixo</span>
        <strong class="documents-stat-card__value">${formatNumber(summary.total_low_stock)}</strong>
      </article>
    </section>
  `;
}

function renderFilters(filters, options) {
  return `
    <div class="card toolbar-card">
      <form class="toolbar toolbar--filters" id="inventory-balances-filters-form">
        <div class="toolbar__group toolbar__group--search">
          <label class="toolbar__label" for="inventory-balances-query">Pesquisar</label>
          <input
            id="inventory-balances-query"
            name="query"
            class="toolbar__input"
            type="text"
            placeholder="Produto, SKU ou armazém"
            value="${escapeHtml(filters.query || '')}"
          />
        </div>

        <div class="toolbar__group">
          <label class="toolbar__label" for="inventory-balances-warehouse">Armazém</label>
          <select
            id="inventory-balances-warehouse"
            name="warehouse"
            class="toolbar__select"
          >
            <option value="">Todos</option>
            ${(options.warehouses || [])
              .map(
                (item) => `
                  <option value="${escapeHtml(item)}" ${filters.warehouse === item ? 'selected' : ''}>${escapeHtml(item)}</option>
                `
              )
              .join('')}
          </select>
        </div>

        <div class="toolbar__group">
          <label class="toolbar__label" for="inventory-balances-status">Status</label>
          <select
            id="inventory-balances-status"
            name="status"
            class="toolbar__select"
          >
            <option value="" ${filters.status === '' ? 'selected' : ''}>Todos</option>
            <option value="out" ${filters.status === 'out' ? 'selected' : ''}>Sem stock</option>
            <option value="low" ${filters.status === 'low' ? 'selected' : ''}>Stock baixo</option>
            <option value="ok" ${filters.status === 'ok' ? 'selected' : ''}>Saudável</option>
          </select>
        </div>

        <div class="toolbar__group">
          <label class="toolbar__label" for="inventory-balances-sort">Ordenar</label>
          <select
            id="inventory-balances-sort"
            name="sortBy"
            class="toolbar__select"
          >
            <option value="product_asc" ${filters.sortBy === 'product_asc' ? 'selected' : ''}>Produto A-Z</option>
            <option value="product_desc" ${filters.sortBy === 'product_desc' ? 'selected' : ''}>Produto Z-A</option>
            <option value="warehouse_asc" ${filters.sortBy === 'warehouse_asc' ? 'selected' : ''}>Armazém A-Z</option>
            <option value="warehouse_desc" ${filters.sortBy === 'warehouse_desc' ? 'selected' : ''}>Armazém Z-A</option>
            <option value="qty_desc" ${filters.sortBy === 'qty_desc' ? 'selected' : ''}>Maior stock</option>
            <option value="qty_asc" ${filters.sortBy === 'qty_asc' ? 'selected' : ''}>Menor stock</option>
            <option value="value_desc" ${filters.sortBy === 'value_desc' ? 'selected' : ''}>Maior valor</option>
            <option value="value_asc" ${filters.sortBy === 'value_asc' ? 'selected' : ''}>Menor valor</option>
          </select>
        </div>

        <div class="toolbar__group toolbar__group--actions">
          <button type="submit" class="btn btn-primary">Aplicar</button>
          <button type="button" class="btn btn-secondary" data-action="reset-balances-filters">Limpar</button>
        </div>
      </form>
    </div>
  `;
}

function renderBalancesTable(rows) {
  if (!rows.length) {
    return `
      <div class="card">
        <div class="card-body empty-state">
          <h2>Sem resultados</h2>
          <p>Não existem saldos de stock que correspondam aos filtros aplicados.</p>
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
              <th>Produto</th>
              <th>SKU</th>
              <th>Armazém</th>
              <th>Qty on hand</th>
              <th>Qty reserved</th>
              <th>Qty available</th>
              <th>Custo médio</th>
              <th>Custo total</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${rows
              .map(
                (row) => `
                  <tr>
                    <td>${escapeHtml(row.product_name)}</td>
                    <td>${escapeHtml(row.product_sku)}</td>
                    <td>${escapeHtml(row.warehouse_name)}</td>
                    <td>${formatNumber(row.qty_on_hand)}</td>
                    <td>${formatNumber(row.qty_reserved)}</td>
                    <td>${formatNumber(row.qty_available)}</td>
                    <td>${formatCurrency(row.avg_unit_cost)}</td>
                    <td>${formatCurrency(row.total_cost)}</td>
                    <td>${getStockStatusBadge(row.stock_status)}</td>
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
        data-action="balances-page-prev"
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
        data-action="balances-page-next"
        ${pagination.page >= pagination.totalPages ? 'disabled' : ''}
      >
        Próxima
      </button>
    </div>
  `;
}

function bindBalancesPageEvents(pagination) {
  const form = document.querySelector('#inventory-balances-filters-form');
  const resetButton = document.querySelector('[data-action="reset-balances-filters"]');
  const prevButton = document.querySelector('[data-action="balances-page-prev"]');
  const nextButton = document.querySelector('[data-action="balances-page-next"]');

  form?.addEventListener('submit', (event) => {
    event.preventDefault();

    const formData = new FormData(form);

    updateInventoryPageFilters({
      query: formData.get('query') || '',
      warehouse: formData.get('warehouse') || '',
      status: formData.get('status') || '',
      sortBy: formData.get('sortBy') || 'product_asc',
      page: 1,
    });
  });

  resetButton?.addEventListener('click', () => {
    resetInventoryPageFilters(['query', 'warehouse', 'status', 'sortBy', 'page']);
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

export async function renderInventoryBalancesPage() {
  const appRoot = document.querySelector('#app');
  if (!appRoot) return;

  const filters = getInventoryPageFilters({
    query: '',
    warehouse: '',
    status: '',
    sortBy: 'product_asc',
    page: 1,
  });

  const { summary, options, items, pagination } = getInventoryBalancesPageData({
    query: filters.query,
    warehouse: filters.warehouse,
    status: filters.status,
    sortBy: filters.sortBy,
    page: filters.page,
    pageSize: PAGE_SIZE,
  });

  appRoot.innerHTML = `
    <section class="page-shell inventory-balances-page">
      <section class="page-header">
        <div>
          <h1>Inventory Balances</h1>
          <p>Visão actual dos saldos de stock por produto e armazém.</p>
        </div>
      </section>

      ${renderSummaryCards(summary)}
      ${renderFilters(filters, options)}
      ${renderBalancesTable(items)}
      ${renderPagination(pagination)}
    </section>
  `;

  bindBalancesPageEvents(pagination);
}
