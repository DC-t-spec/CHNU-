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
  const allRows = (Array.isArray(products) ? products : []).map(normalizeProduct);
  let filteredRows = [...allRows];
  let searchTerm = '';
  let statusFilter = 'all';
  let debounceTimer;

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
        <div style="display:flex;gap:12px;align-items:center;flex-wrap:wrap;padding:16px 16px 0 16px;">
          <input
            type="search"
            class="input"
            id="products-search"
            placeholder="Pesquisar por code ou name"
            autocomplete="off"
            style="min-width:240px;flex:1;"
          />

          <select id="products-status-filter" class="input" style="max-width:200px;">
            <option value="all">Todos</option>
            <option value="active">Ativos</option>
            <option value="inactive">Inativos</option>
          </select>
        </div>

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
              ${renderProductsRows(filteredRows)}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  `;

  const tableBody = app.querySelector('tbody');
  const searchInput = app.querySelector('#products-search');
  const statusSelect = app.querySelector('#products-status-filter');
  if (!tableBody || !searchInput || !statusSelect) return;

  function applyFilters() {
    const normalizedQuery = searchTerm.trim().toLowerCase();

    filteredRows = allRows.filter((product) => {
      const matchesSearch =
        !normalizedQuery ||
        String(product.code ?? '')
          .toLowerCase()
          .includes(normalizedQuery) ||
        String(product.name ?? '')
          .toLowerCase()
          .includes(normalizedQuery);

      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && product.is_active === true) ||
        (statusFilter === 'inactive' && product.is_active === false);

      return matchesSearch && matchesStatus;
    });

    tableBody.innerHTML = renderProductsRows(filteredRows);
    attachRowEvents();
  }

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
          const rowIndex = allRows.findIndex((row) => String(row.id) === String(productId));

          if (rowIndex >= 0) {
            allRows[rowIndex] = normalizeProduct(updatedProduct, rowIndex);
            applyFilters();
          }
        } catch {
          button.disabled = false;
        }
      });
    });
  }

  searchInput.addEventListener('input', (event) => {
    const nextValue = event.target?.value ?? '';

    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      searchTerm = nextValue;
      applyFilters();
    }, 300);
  });

  statusSelect.addEventListener('change', (event) => {
    statusFilter = event.target?.value ?? 'all';
    applyFilters();
  });

  attachRowEvents();
}
