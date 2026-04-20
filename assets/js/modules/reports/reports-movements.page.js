import { getInventoryLedger, syncInventoryProducts } from '../../services/inventory.service.js';

import {
  escapeHtml,
  formatDateTime,
  formatNumber,
  getMovementTypeLabel,
} from './reports-shared.js';

const movementFiltersState = {
  from: '',
  to: '',
  productId: '',
};

function normalizeDate(dateValue) {
  const date = new Date(dateValue);
  return Number.isNaN(date.getTime()) ? null : date;
}

function isWithinRange(dateValue, from, to) {
  const date = normalizeDate(dateValue);
  if (!date) return false;

  if (from) {
    const fromDate = normalizeDate(`${from}T00:00:00`);
    if (fromDate && date < fromDate) return false;
  }

  if (to) {
    const toDate = normalizeDate(`${to}T23:59:59`);
    if (toDate && date > toDate) return false;
  }

  return true;
}

function getProductOptions(rows) {
  const productMap = new Map();

  rows.forEach((row) => {
    if (!row.product_id) return;
    if (productMap.has(row.product_id)) return;

    productMap.set(row.product_id, {
      id: row.product_id,
      label: `${row.product_code || '—'} — ${row.product_name || 'Produto'}`,
    });
  });

  return [...productMap.values()].sort((a, b) => a.label.localeCompare(b.label));
}

function applyMovementFilters(rows) {
  return rows
    .filter((row) => {
      if (movementFiltersState.productId && row.product_id !== movementFiltersState.productId) {
        return false;
      }

      return isWithinRange(row.date, movementFiltersState.from, movementFiltersState.to);
    })
    .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
}

function summarize(rows) {
  return rows.reduce(
    (acc, row) => {
      acc.totalIn += Number(row.qty_in || 0);
      acc.totalOut += Number(row.qty_out || 0);
      return acc;
    },
    {
      totalIn: 0,
      totalOut: 0,
    }
  );
}

function renderSummary(summary, totalRows) {
  return `
    <section class="documents-stats-grid reports-kpis-grid">
      <article class="documents-stat-card">
        <span class="documents-stat-card__label">Total entradas</span>
        <strong class="documents-stat-card__value">${formatNumber(summary.totalIn)}</strong>
      </article>

      <article class="documents-stat-card">
        <span class="documents-stat-card__label">Total saídas</span>
        <strong class="documents-stat-card__value">${formatNumber(summary.totalOut)}</strong>
      </article>

      <article class="documents-stat-card">
        <span class="documents-stat-card__label">Movimentos filtrados</span>
        <strong class="documents-stat-card__value">${formatNumber(totalRows)}</strong>
      </article>
    </section>
  `;
}

function renderFilters(productOptions) {
  return `
    <div class="card toolbar-card">
      <form class="toolbar toolbar--filters reports-movements-toolbar" id="reports-movements-filters-form">
        <div class="toolbar__group">
          <label class="toolbar__label" for="reports-movements-from">Período (de)</label>
          <input id="reports-movements-from" name="from" type="date" class="toolbar__input" value="${escapeHtml(
            movementFiltersState.from
          )}" />
        </div>

        <div class="toolbar__group">
          <label class="toolbar__label" for="reports-movements-to">Período (até)</label>
          <input id="reports-movements-to" name="to" type="date" class="toolbar__input" value="${escapeHtml(
            movementFiltersState.to
          )}" />
        </div>

        <div class="toolbar__group toolbar__group--search">
          <label class="toolbar__label" for="reports-movements-product">Produto</label>
          <select id="reports-movements-product" name="productId" class="toolbar__select">
            <option value="">Todos</option>
            ${productOptions
              .map(
                (product) => `
                  <option value="${escapeHtml(product.id)}" ${
                  movementFiltersState.productId === product.id ? 'selected' : ''
                }>
                    ${escapeHtml(product.label)}
                  </option>
                `
              )
              .join('')}
          </select>
        </div>

        <div class="toolbar__group toolbar__group--actions">
          <button type="submit" class="btn btn-primary">Aplicar</button>
          <button type="button" class="btn btn-secondary" data-action="reset-reports-movements">Limpar</button>
        </div>
      </form>
    </div>
  `;
}

function renderMovementsTable(rows) {
  if (!rows.length) {
    return `
      <div class="card">
        <div class="card-body empty-state">
          <h2>Sem movimentos</h2>
          <p>Não existem movimentos para os filtros selecionados.</p>
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
              <th>Entrada</th>
              <th>Saída</th>
              <th>Saldo</th>
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

function bindEvents() {
  const filtersForm = document.querySelector('#reports-movements-filters-form');
  const resetButton = document.querySelector('[data-action="reset-reports-movements"]');

  filtersForm?.addEventListener('submit', (event) => {
    event.preventDefault();
    const formData = new FormData(filtersForm);

    movementFiltersState.from = String(formData.get('from') || '');
    movementFiltersState.to = String(formData.get('to') || '');
    movementFiltersState.productId = String(formData.get('productId') || '');

    renderReportsMovementsPage();
  });

  resetButton?.addEventListener('click', () => {
    movementFiltersState.from = '';
    movementFiltersState.to = '';
    movementFiltersState.productId = '';
    renderReportsMovementsPage();
  });
}

export async function renderReportsMovementsPage() {
  const appRoot = document.querySelector('#app');
  if (!appRoot) return;

  await syncInventoryProducts();

  const allMovements = getInventoryLedger();
  const filteredRows = applyMovementFilters(allMovements);
  const summary = summarize(filteredRows);
  const productOptions = getProductOptions(allMovements);

  appRoot.innerHTML = `
    <section class="page-shell reports-page reports-movements-page">
      <section class="page-header">
        <div>
          <h1>Movement Report</h1>
          <p>Resumo e detalhe dos movimentos de stock.</p>
        </div>
      </section>

      ${renderSummary(summary, filteredRows.length)}
      ${renderFilters(productOptions)}
      ${renderMovementsTable(filteredRows)}
    </section>
  `;

  bindEvents();
}
