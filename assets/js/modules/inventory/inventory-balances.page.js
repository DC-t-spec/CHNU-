import {
  getInventoryBalances,
  getInventoryBalanceSummary,
} from '../../services/inventory.service.js';

function formatNumber(value) {
  return new Intl.NumberFormat('pt-PT').format(Number(value || 0));
}

function formatCurrency(value) {
  return new Intl.NumberFormat('pt-PT', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value || 0));
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
        <span class="documents-stat-card__label">Qty reserved</span>
        <strong class="documents-stat-card__value">${formatNumber(summary.total_qty_reserved)}</strong>
      </article>

      <article class="documents-stat-card">
        <span class="documents-stat-card__label">Valor total stock</span>
        <strong class="documents-stat-card__value">${formatCurrency(summary.total_stock_value)}</strong>
      </article>
    </section>
  `;
}

function renderBalancesTable(rows) {
  if (!rows.length) {
    return `
      <div class="card">
        <div class="card-body">
          <p>Não existem saldos de stock para apresentar.</p>
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
            </tr>
          </thead>
          <tbody>
            ${rows
              .map(
                (row) => `
                  <tr>
                    <td>${row.product_name}</td>
                    <td>${row.product_sku}</td>
                    <td>${row.warehouse_name}</td>
                    <td>${formatNumber(row.qty_on_hand)}</td>
                    <td>${formatNumber(row.qty_reserved)}</td>
                    <td>${formatNumber(row.qty_available)}</td>
                    <td>${formatCurrency(row.avg_unit_cost)}</td>
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

export async function renderInventoryBalancesPage() {
  const appRoot = document.querySelector('#app');
  if (!appRoot) return;

  const balances = getInventoryBalances();
  const summary = getInventoryBalanceSummary();

  appRoot.innerHTML = `
    <section class="page-header">
      <div>
        <h1>Inventory Balances</h1>
        <p>Visão actual dos saldos de stock por produto e armazém.</p>
      </div>
    </section>

    ${renderSummaryCards(summary)}

    ${renderBalancesTable(balances)}
  `;
}
