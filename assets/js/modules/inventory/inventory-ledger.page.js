import {
  getInventoryLedger,
  getInventoryLedgerSummary,
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

function formatDate(value) {
  if (!value) return '—';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat('pt-PT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
}

function renderDirectionChip(direction) {
  const label = direction === 'in' ? 'Entrada' : direction === 'out' ? 'Saída' : '—';
  const className =
    direction === 'in'
      ? 'status-chip status-posted'
      : direction === 'out'
      ? 'status-chip status-cancelled'
      : 'status-chip status-draft';

  return `<span class="${className}">${label}</span>`;
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

function renderLedgerTable(rows) {
  if (!rows.length) {
    return `
      <div class="card">
        <div class="card-body">
          <p>Não existem movimentos de stock para apresentar.</p>
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
              <th>Movimento</th>
              <th>Documento</th>
              <th>Produto</th>
              <th>SKU</th>
              <th>Armazém</th>
              <th>Direcção</th>
              <th>Qty</th>
              <th>Custo unitário</th>
              <th>Custo total</th>
            </tr>
          </thead>
          <tbody>
            ${rows
              .map(
                (row) => `
                  <tr>
                    <td>${formatDate(row.date)}</td>
                    <td>${row.movement_type || row.move_type || '—'}</td>
                    <td>${row.reference_label}</td>
                    <td>${row.product_name}</td>
                    <td>${row.product_sku}</td>
                    <td>${row.warehouse_name}</td>
                    <td>${renderDirectionChip(row.direction)}</td>
                    <td>${formatNumber(row.qty)}</td>
                    <td>${formatCurrency(row.unit_cost)}</td>
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

export async function renderInventoryLedgerPage() {
  const appRoot = document.querySelector('#app');
  if (!appRoot) return;

  const ledger = getInventoryLedger();
  const summary = getInventoryLedgerSummary();

  appRoot.innerHTML = `
    <section class="page-header">
      <div>
        <h1>Inventory Ledger</h1>
        <p>Histórico de movimentos de stock derivados das operações do sistema.</p>
      </div>
    </section>

    ${renderSummaryCards(summary)}

    ${renderLedgerTable(ledger)}
  `;
}
