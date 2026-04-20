import { listProductsAsync, toggleProductActive } from '../../services/products.service.js';
import { navigateTo } from '../../core/router.js';

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
    id: product.id ?? '',
    code: product.code ?? product.sku ?? product.product_code ?? `PRD-${index + 1}`,
    name: product.name ?? product.description ?? product.itemName ?? '—',
    is_active: product.is_active ?? true,
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
        <td colspan="4" style="text-align:center;">Sem produtos disponíveis.</td>
      </tr>
    `;
  }

  return rows
    .map(
      (row) => `
        <tr data-product-id="${escapeHtml(row.id)}">
          <td>${escapeHtml(row.code)}</td>
          <td>${escapeHtml(row.name)}</td>
          <td style="text-align:right;">${formatCurrency(row.unitPrice)}</td>
          <td style="text-align:right;">
            <button type="button" class="btn btn-secondary btn-edit-product" data-product-id="${escapeHtml(row.id)}" ${row.id ? '' : 'disabled'}>Editar</button>
            <button
              type="button"
              class="btn ${row.is_active ? 'btn-danger' : 'btn-primary'} btn-toggle-product-active"
              data-product-id="${escapeHtml(row.id)}"
              data-is-active="${row.is_active ? 'true' : 'false'}"
              ${row.id ? '' : 'disabled'}
            >
              ${row.is_active ? 'Desativar' : 'Ativar'}
            </button>
          </td>
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

        <div class="page-actions">
          <a href="#products/new" class="btn btn-primary">+ Novo produto</a>
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
                <th style="text-align:right;">Ações</th>
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

  const tableBody = app.querySelector('tbody');
  if (!tableBody) return;

  function attachRowEvents() {
    app.querySelectorAll('.btn-edit-product').forEach((button) => {
      button.addEventListener('click', () => {
        const productId = button.getAttribute('data-product-id');
        if (!productId) return;
        navigateTo(`/products/edit/${productId}`);
      });
    });

    app.querySelectorAll('.btn-toggle-product-active').forEach((button) => {
      button.addEventListener('click', async () => {
        const productId = button.getAttribute('data-product-id');
        const isActive = button.getAttribute('data-is-active') === 'true';

        if (!productId) return;

        button.disabled = true;
        try {
          const updatedProduct = await toggleProductActive(productId, isActive);
          const rowIndex = rows.findIndex((row) => String(row.id) === String(productId));

          if (rowIndex >= 0) {
            rows[rowIndex] = normalizeProduct(updatedProduct, rowIndex);
            tableBody.innerHTML = renderProductsRows(rows);
            attachRowEvents();
          }
        } catch {
          button.disabled = false;
        }
      });
    });
  }

  attachRowEvents();
}
