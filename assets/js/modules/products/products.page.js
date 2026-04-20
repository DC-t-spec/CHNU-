import { listProductsAsync, toggleProductActive } from '../../services/products.service.js';
import { navigateTo } from '../../core/router.js';

const PAGE_SIZE = 10;

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

function renderProductStatusBadge(isActive) {
  return `
    <span class="products-status-badge ${isActive ? 'products-status-badge--active' : 'products-status-badge--inactive'}">
      ${isActive ? 'Ativo' : 'Inativo'}
    </span>
  `;
}

function renderProductsRows(rows) {
  if (!rows.length) {
    return `
      <tr>
        <td colspan="5" class="products-empty-cell">Sem produtos disponíveis.</td>
      </tr>
    `;
  }

  return rows
    .map(
      (row) => `
        <tr data-product-id="${escapeHtml(row.id)}">
          <td class="products-col-code">${escapeHtml(row.code)}</td>
          <td class="products-col-name">${escapeHtml(row.name)}</td>
          <td class="products-col-status">${renderProductStatusBadge(row.is_active)}</td>
          <td class="products-col-price">${formatCurrency(row.unitPrice)}</td>
          <td class="products-col-actions">
            <div class="table-actions products-actions">
              <button type="button" class="btn btn-secondary btn-sm btn-edit-product" data-product-id="${escapeHtml(row.id)}" ${row.id ? '' : 'disabled'}>Editar</button>
              <button
                type="button"
                class="btn btn-sm ${row.is_active ? 'btn-danger' : 'btn-primary'} btn-toggle-product-active"
                data-product-id="${escapeHtml(row.id)}"
                data-is-active="${row.is_active ? 'true' : 'false'}"
                ${row.id ? '' : 'disabled'}
              >
                ${row.is_active ? 'Desativar' : 'Ativar'}
              </button>
            </div>
          </td>
        </tr>
      `
    )
    .join('');
}

function sortRows(rows, sortValue) {
  const [key, direction] = String(sortValue ?? 'code_asc').split('_');
  const multiplier = direction === 'desc' ? -1 : 1;

  return [...rows].sort((a, b) => {
    if (key === 'price') {
      const valueA = Number(a.unitPrice ?? 0);
      const valueB = Number(b.unitPrice ?? 0);
      return (valueA - valueB) * multiplier;
    }

    const field = key === 'name' ? 'name' : 'code';
    const valueA = String(a[field] ?? '').toLowerCase();
    const valueB = String(b[field] ?? '').toLowerCase();
    return valueA.localeCompare(valueB, 'pt-PT') * multiplier;
  });
}

function paginateRows(rows, currentPage, pageSize) {
  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);
  const start = (safeCurrentPage - 1) * pageSize;
  const paginatedRows = rows.slice(start, start + pageSize);

  return {
    paginatedRows,
    currentPage: safeCurrentPage,
    totalPages,
  };
}

export async function renderProductsPage() {
  const app = document.querySelector('#app');
  if (!app) return;

  const products = await listProductsAsync();
  const allRows = (Array.isArray(products) ? products : []).map(normalizeProduct);
  let searchTerm = '';
  let statusFilter = 'all';
  let sortOption = 'code_asc';
  const pageSize = 10;
  let currentPage = 1;
  let debounceTimer;

  app.innerHTML = `
    <section class="page-shell products-page">
      <div class="page-header products-page__header">
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

          <select id="products-sort" class="input" style="max-width:220px;">
            <option value="code_asc">Code (A-Z)</option>
            <option value="code_desc">Code (Z-A)</option>
            <option value="name_asc">Name (A-Z)</option>
            <option value="name_desc">Name (Z-A)</option>
            <option value="price_asc">Unit price (↑)</option>
            <option value="price_desc">Unit price (↓)</option>
          </select>
        </div>

        <div class="table-responsive products-table-wrap">
          <table class="data-table products-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Name</th>
                <th>Status</th>
                <th class="products-th-price">Unit price</th>
                <th class="products-th-actions">Ações</th>
              </tr>
            </thead>
            <tbody></tbody>
          </table>
        </div>

        <div id="products-pagination" style="display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;padding:12px 16px 16px 16px;">
          <span id="products-pagination-state">Página 1 de 1</span>
          <div style="display:flex;gap:8px;">
            <button type="button" class="btn btn-secondary" id="products-prev-page">Anterior</button>
            <button type="button" class="btn btn-secondary" id="products-next-page">Próxima</button>
          </div>
        </div>
      </div>
    </section>
  `;

  const tableBody = app.querySelector('tbody');
  const searchInput = app.querySelector('#products-search');
  const statusSelect = app.querySelector('#products-status-filter');
  const sortSelect = app.querySelector('#products-sort');
  const pageState = app.querySelector('#products-pagination-state');
  const prevButton = app.querySelector('#products-prev-page');
  const nextButton = app.querySelector('#products-next-page');
  if (!tableBody || !searchInput || !statusSelect || !sortSelect || !pageState || !prevButton || !nextButton) return;

  function applyView() {
    const normalizedQuery = searchTerm.trim().toLowerCase();

    const searchedRows = allRows.filter((product) => {
      if (!normalizedQuery) return true;
      return (
        String(product.code ?? '')
          .toLowerCase()
          .includes(normalizedQuery) ||
        String(product.name ?? '')
          .toLowerCase()
          .includes(normalizedQuery)
      );
    });

    const statusRows = searchedRows.filter((product) => {
      return (
        statusFilter === 'all' ||
        (statusFilter === 'active' && product.is_active === true) ||
        (statusFilter === 'inactive' && product.is_active === false)
      );
    });

    const sortedRows = sortRows(statusRows, sortOption);
    const pagination = paginateRows(sortedRows, currentPage, pageSize);
    currentPage = pagination.currentPage;

    tableBody.innerHTML = renderProductsRows(pagination.paginatedRows);
    pageState.textContent = `Página ${pagination.currentPage} de ${pagination.totalPages}`;
    prevButton.disabled = pagination.currentPage <= 1;
    nextButton.disabled = pagination.currentPage >= pagination.totalPages;

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
            applyView();
          }
        } catch {
          button.disabled = false;
        }
      });
    });
  }

  function renderTable() {
    const processedRows = getProcessedRows();
    const totalItems = processedRows.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));

    if (currentPage > totalPages) {
      currentPage = totalPages;
    }

    const start = (currentPage - 1) * PAGE_SIZE;
    const pagedRows = processedRows.slice(start, start + PAGE_SIZE);

    tableBody.innerHTML = renderProductsRows(pagedRows);
    totalResults.textContent = `${totalItems} produto${totalItems === 1 ? '' : 's'}`;
    paginationInfo.textContent = `Página ${currentPage} de ${totalPages}`;
    prevPageButton.disabled = currentPage <= 1;
    nextPageButton.disabled = currentPage >= totalPages;

    attachRowEvents();
  }

  searchInput.addEventListener('input', (event) => {
    const nextValue = event.target?.value ?? '';

    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      searchTerm = nextValue;
      currentPage = 1;
      applyView();
    }, 300);
  });

  statusSelect.addEventListener('change', (event) => {
    statusFilter = event.target?.value ?? 'all';
    currentPage = 1;
    applyView();
  });

  sortSelect.addEventListener('change', (event) => {
    sortOption = event.target?.value ?? 'code_asc';
    currentPage = 1;
    applyView();
  });

  prevButton.addEventListener('click', () => {
    currentPage -= 1;
    applyView();
  });

  nextButton.addEventListener('click', () => {
    currentPage += 1;
    applyView();
  });

  applyView();
}
