import { listProductsAsync } from '../../services/products.service.js';

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function formatCurrency(value) {
  const numeric = Number(value ?? 0);
  return Number.isFinite(numeric)
    ? numeric.toLocaleString('pt-PT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : '0,00';
}

function normalizeProduct(product, index) {
  return {
    code: product.code ?? product.sku ?? product.product_code ?? `PRD-${index + 1}`,
    name: product.name ?? product.description ?? product.itemName ?? '—',
    unitPrice:
      product.unitPrice ??
      product.unit_price ??
      product.price ??
      product.sale_price ??
      product.avg_unit_cost ??
      0,
  };
}

function renderProductsRows(rows) {
  if (!rows.length) {
    return `
      <tr>
        <td colspan="3" style="text-align:center;">Sem produtos disponíveis.</td>
      </tr>
    `;
  }

  return rows
    .map(
      (row) => `
        <tr>
          <td>${escapeHtml(row.code)}</td>
          <td>${escapeHtml(row.name)}</td>
          <td style="text-align:right;">${formatCurrency(row.unitPrice)}</td>
        </tr>
      `
    )
    .join('');
}

export async function renderProductsPage() {
  const app = document.querySelector('#app');
  if (!app) return;

  const products = await listProductsAsync();
  const rows = (Array.isArray(products) ? products : []).map(normalizeProduct);

  app.innerHTML = `
    <section class="page-shell products-page">
      <div class="page-header" style="display:flex;justify-content:space-between;align-items:center;gap:16px;flex-wrap:wrap;">
        <div>
          <h1>Products</h1>
          <p>Consulta de produtos cadastrados no sistema.</p>
        </div>
      </div>

      <div class="card" style="margin-top:16px;">
        <div class="table-responsive">
          <table class="table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Name</th>
                <th style="text-align:right;">Unit price</th>
              </tr>
            </thead>
            <tbody>
              ${renderProductsRows(rows)}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  `;
}
