import { getInventoryBalances } from '../../services/inventory.service.js';

import {
  escapeHtml,
  formatCurrency,
  formatNumber,
  getStockStatusBadge,
  getStockStatusLabel,
} from './reports-shared.js';

const filtersState = {
  query: '',
  status: '',
};

function applyFilters(rows) {
  let filtered = rows.slice();

  if (filtersState.query) {
    const query = filtersState.query.trim().toLowerCase();
    filtered = filtered.filter((row) =>
      [row.product_code, row.product_name]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query))
    );
  }

  if (filtersState.status) {
    filtered = filtered.filter((row) => row.stock_status === filtersState.status);
  }

  return filtered.sort((a, b) => a.product_name.localeCompare(b.product_name));
}

function renderFilters() {
  return `
    <div class="card toolbar-card">
      <form class="toolbar toolbar--filters" id="reports-stock-filters-form">
        <div class="toolbar__group toolbar__group--search">
          <label class="toolbar__label" for="reports-stock-query">Pesquisar</label>
          <input
            id="reports-stock-query"
            name="query"
            class="toolbar__input"
            type="text"
            placeholder="Code ou name"
            value="${escapeHtml(filtersState.query)}"
          />
        </div>

        <div class="toolbar__group">
          <label class="toolbar__label" for="reports-stock-status">Status</label>
          <select id="reports-stock-status" name="status" class="toolbar__select">
            <option value="" ${filtersState.status === '' ? 'selected' : ''}>Todos</option>
            <option value="ok" ${filtersState.status === 'ok' ? 'selected' : ''}>Normal</option>
            <option value="low" ${filtersState.status === 'low' ? 'selected' : ''}>Stock baixo</option>
            <option value="out" ${filtersState.status === 'out' ? 'selected' : ''}>Sem stock</option>
          </select>
        </div>

        <div class="toolbar__group toolbar__group--actions">
          <button type="submit" class="btn btn-primary">Aplicar</button>
          <button type="button" class="btn btn-secondary" data-action="reset-reports-stock">Limpar</button>
        </div>
      </form>
    </div>
  `;
}

function renderStockTable(rows) {
  if (!rows.length) {
    return `
      <div class="card">
        <div class="card-body empty-state">
          <h2>Sem resultados</h2>
          <p>Não existem registos para os filtros aplicados.</p>
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
              <th>Code</th>
              <th>Name</th>
              <th>Stock atual</th>
              <th>Stock mínimo</th>
              <th>Status</th>
              <th>Valor de stock</th>
            </tr>
          </thead>
          <tbody>
            ${rows
              .map(
                (row) => `
                  <tr>
                    <td>${escapeHtml(row.product_code)}</td>
                    <td>${escapeHtml(row.product_name)}</td>
                    <td>${formatNumber(row.qty_on_hand)}</td>
                    <td>${formatNumber(row.product_min_qty)}</td>
                    <td data-label="${escapeHtml(getStockStatusLabel(row.stock_status))}">${getStockStatusBadge(
                  row.stock_status
                )}</td>
                    <td>${formatCurrency(row.total_cost)}</td>
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

function bindEvents() {
  const filtersForm = document.querySelector('#reports-stock-filters-form');
  const resetButton = document.querySelector('[data-action="reset-reports-stock"]');

  filtersForm?.addEventListener('submit', (event) => {
    event.preventDefault();
    const formData = new FormData(filtersForm);

    filtersState.query = String(formData.get('query') || '');
    filtersState.status = String(formData.get('status') || '');

    renderReportsStockPage();
  });

  resetButton?.addEventListener('click', () => {
    filtersState.query = '';
    filtersState.status = '';
    renderReportsStockPage();
  });
}

export async function renderReportsStockPage() {
  const appRoot = document.querySelector('#app');
  if (!appRoot) return;

  const rows = applyFilters(getInventoryBalances());

  appRoot.innerHTML = `
    <section class="page-shell reports-page reports-stock-page">
      <section class="page-header">
        <div>
          <h1>Stock Report</h1>
          <p>Relatório detalhado do estado atual de stock.</p>
        </div>
      </section>

      ${renderFilters()}
      ${renderStockTable(rows)}
    </section>
  `;

  bindEvents();
}
