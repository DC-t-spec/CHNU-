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
  const sorted = [...rows];

  const compareText = (a, b) =>
    String(a ?? '').localeCompare(String(b ?? ''), 'pt-PT', { sensitivity: 'base', numeric: true });

  if (sortValue === 'code_asc') sorted.sort((a, b) => compareText(a.code, b.code));
  else if (sortValue === 'code_desc') sorted.sort((a, b) => compareText(b.code, a.code));
  else if (sortValue === 'name_asc') sorted.sort((a, b) => compareText(a.name, b.name));
  else if (sortValue === 'name_desc') sorted.sort((a, b) => compareText(b.name, a.name));
  else if (sortValue === 'price_asc') sorted.sort((a, b) => Number(a.unitPrice ?? 0) - Number(b.unitPrice ?? 0));
  else if (sortValue === 'price_desc') sorted.sort((a, b) => Number(b.unitPrice ?? 0) - Number(a.unitPrice ?? 0));

  return sorted;
}

export async function renderProductsPage() {
  const app = document.querySelector('#app');
  if (!app) return;

  const products = await listProductsAsync();
  const allRows = (Array.isArray(products) ? products : []).map(normalizeProduct);

  let searchTerm = '';
  let statusFilter = 'all';
  let sortBy = 'code_asc';
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

      <div class="card products-card">
        <div class="products-toolbar" role="search">
          <div class="toolbar__group toolbar__group--search products-toolbar__search">
            <label for="products-search" class="toolbar__label">Pesquisar</label>
            <input
              type="search"
              class="toolbar__input products-toolbar__input"
              id="products-search"
              placeholder="Pesquisar por code ou name"
              autocomplete="off"
            />
          </div>

          <div class="toolbar__group products-toolbar__filter">
            <label for="products-status-filter" class="toolbar__label">Status</label>
            <select id="products-status-filter" class="toolbar__select products-toolbar__select">
              <option value="all">Todos</option>
              <option value="active">Ativos</option>
              <option value="inactive">Inativos</option>
            </select>
          </div>

          <div class="toolbar__group products-toolbar__sort">
            <label for="products-sort" class="toolbar__label">Ordenar por</label>
            <select id="products-sort" class="toolbar__select products-toolbar__select">
              <option value="code_asc">Code (A → Z)</option>
              <option value="code_desc">Code (Z → A)</option>
              <option value="name_asc">Name (A → Z)</option>
              <option value="name_desc">Name (Z → A)</option>
              <option value="price_asc">Price (menor → maior)</option>
              <option value="price_desc">Price (maior → menor)</option>
            </select>
          </div>
        </div>

        <div class="products-table-header">
          <span id="products-total-results" class="products-total-results">0 produtos</span>
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

        <div class="pagination products-pagination">
          <button type="button" class="btn btn-secondary btn-sm" id="products-prev-page">Anterior</button>
          <span id="products-pagination-info" class="pagination-info">Página 1 de 1</span>
          <button type="button" class="btn btn-secondary btn-sm" id="products-next-page">Próxima</button>
        </div>
      </div>
    </section>
  `;

  const tableBody = app.querySelector('tbody');
  const searchInput = app.querySelector('#products-search');
  const statusSelect = app.querySelector('#products-status-filter');
  const sortSelect = app.querySelector('#products-sort');
  const totalResults = app.querySelector('#products-total-results');
  const prevPageButton = app.querySelector('#products-prev-page');
  const nextPageButton = app.querySelector('#products-next-page');
  const paginationInfo = app.querySelector('#products-pagination-info');

  if (
    !tableBody ||
    !searchInput ||
    !statusSelect ||
    !sortSelect ||
    !totalResults ||
    !prevPageButton ||
    !nextPageButton ||
    !paginationInfo
  ) {
    return;
  }

  function getProcessedRows() {
    const normalizedQuery = searchTerm.trim().toLowerCase();

    const filtered = allRows.filter((product) => {
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

    return sortRows(filtered, sortBy);
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
            renderTable();
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
      renderTable();
    }, 300);
  });

  statusSelect.addEventListener('change', (event) => {
    statusFilter = event.target?.value ?? 'all';
    currentPage = 1;
    renderTable();
  });

  sortSelect.addEventListener('change', (event) => {
    sortBy = event.target?.value ?? 'code_asc';
    currentPage = 1;
    renderTable();
  });

  prevPageButton.addEventListener('click', () => {
    if (currentPage <= 1) return;
    currentPage -= 1;
    renderTable();
  });

  nextPageButton.addEventListener('click', () => {
    const totalPages = Math.max(1, Math.ceil(getProcessedRows().length / PAGE_SIZE));
    if (currentPage >= totalPages) return;
    currentPage += 1;
    renderTable();
  });

  renderTable();
}
