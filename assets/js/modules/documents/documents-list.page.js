import { listDocuments } from './documents.service.js';
import { handleDocumentPosting } from './document-posting.js';
import { handleDocumentCancel } from './document-cancel.js';

const DEFAULT_PAGE_SIZE = 5;

export async function renderDocumentsListPage() {
  const appRoot = document.querySelector('#app');
  const filters = getCurrentListFilters();

const result = listDocuments({
  filters: {
    query: filters.query,
    status: filters.status,
  },
  sort: {
    field: 'date',
    direction: filters.sortBy === 'dateAsc' ? 'asc' : 'desc',
  },
  pagination: {
    page: filters.page,
    pageSize: DEFAULT_PAGE_SIZE,
  },
});

const { data, meta, summary } = result;

const items = data;
const summaries = summary;
const pagination = {
  page: meta.page,
  totalPages: meta.totalPages,
  hasPrev: meta.page > 1,
  hasNext: meta.page < meta.totalPages,
};

  appRoot.innerHTML = `
    <section class="page-shell documents-page">
      <div class="page-header">
        <div>
          <h1>Documentos</h1>
          <p>Gestão de documentos operacionais do sistema</p>
        </div>

        <div class="page-actions">
          <a href="#documents/new" class="btn btn-primary">Novo documento</a>
        </div>
      </div>

      <div class="documents-stats-grid">
        <div class="documents-stat-card">
          <span class="documents-stat-card__label">Total</span>
          <strong class="documents-stat-card__value">${summaries.total}</strong>
        </div>

        <div class="documents-stat-card">
          <span class="documents-stat-card__label">Draft</span>
          <strong class="documents-stat-card__value">${summaries.draft}</strong>
        </div>

        <div class="documents-stat-card">
          <span class="documents-stat-card__label">Posted</span>
          <strong class="documents-stat-card__value">${summaries.posted}</strong>
        </div>

        <div class="documents-stat-card">
          <span class="documents-stat-card__label">Cancelled</span>
          <strong class="documents-stat-card__value">${summaries.cancelled}</strong>
        </div>
      </div>

      <div class="card toolbar-card">
        <form id="documents-toolbar-form" class="toolbar toolbar--filters">
          <div class="toolbar__group toolbar__group--search">
            <label for="documents-search" class="toolbar__label">Pesquisar</label>
            <input
              id="documents-search"
              name="query"
              type="text"
              class="toolbar__input"
              placeholder="Número, tipo, origem ou destino"
              value="${escapeHtml(filters.query)}"
            />
          </div>

          <div class="toolbar__group">
            <label for="documents-status" class="toolbar__label">Status</label>
            <select id="documents-status" name="status" class="toolbar__select">
              <option value="all" ${filters.status === 'all' ? 'selected' : ''}>Todos</option>
              <option value="draft" ${filters.status === 'draft' ? 'selected' : ''}>Draft</option>
              <option value="posted" ${filters.status === 'posted' ? 'selected' : ''}>Posted</option>
              <option value="cancelled" ${filters.status === 'cancelled' ? 'selected' : ''}>Cancelled</option>
            </select>
          </div>

          <div class="toolbar__group toolbar__group--actions">
            <button type="submit" class="btn btn-primary">Aplicar</button>
            <button type="button" class="btn btn-secondary" id="documents-reset-filters">Limpar</button>
          </div>
        </form>
      </div>

      <div class="card">
        ${
          items.length
            ? `
              <div class="table-responsive">
                <table class="data-table">
                  <thead>
                    <tr>
                      <th>Número</th>
                      <th data-sort="date" class="sortable">
                        Data ${renderSortIndicator(filters.sortBy, 'date')}
                      </th>
                      <th>Tipo</th>
                      <th>Origem</th>
                      <th>Destino</th>
                      <th>Status</th>
                      <th>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${items
                      .map(
                        (doc) => `
                          <tr>
                            <td>${doc.number || '-'}</td>
                            <td>${formatDocumentDate(doc.date)}</td>
                            <td>${doc.type || '-'}</td>
                            <td>${doc.origin || '-'}</td>
                            <td>${doc.destination || '-'}</td>
                            <td>
                              <span class="status-chip status-${doc.status}">
                                ${doc.statusLabel}
                              </span>
                            </td>
                            <td>
                              <div class="table-actions">
                                <a href="#documents/view?id=${doc.id}" class="btn btn-sm btn-secondary">Ver</a>

                                ${
                                  doc.canEdit
                                    ? `
                                      <a href="#documents/edit?id=${doc.id}" class="btn btn-sm btn-primary">Editar</a>
                                    `
                                    : ''
                                }

                                ${
                                  doc.canPost
                                    ? `
                                      <button
                                        type="button"
                                        class="btn btn-sm btn-success"
                                        data-action="post-document"
                                        data-document-id="${doc.id}"
                                      >
                                        Postar
                                      </button>
                                    `
                                    : ''
                                }

                                ${
                                  doc.canCancel
                                    ? `
                                      <button
                                        type="button"
                                        class="btn btn-sm btn-danger"
                                        data-action="cancel-document"
                                        data-document-id="${doc.id}"
                                      >
                                        Cancelar
                                      </button>
                                    `
                                    : ''
                                }
                              </div>
                            </td>
                          </tr>
                        `
                      )
                      .join('')}
                  </tbody>
                </table>
              </div>

              <div class="pagination">
                <button
                  class="btn btn-secondary"
                  data-page="prev"
                  ${pagination.hasPrev ? '' : 'disabled'}
                >
                  Anterior
                </button>

                <span class="pagination-info">
                  Página ${pagination.page} de ${pagination.totalPages}
                </span>

                <button
                  class="btn btn-secondary"
                  data-page="next"
                  ${pagination.hasNext ? '' : 'disabled'}
                >
                  Próxima
                </button>
              </div>
            `
            : `
              <div class="empty-state">
                <h2>Nenhum documento encontrado</h2>
                <p>Não há resultados para os filtros aplicados.</p>
                <a href="#documents/new" class="btn btn-primary">Criar novo documento</a>
              </div>
            `
        }
      </div>
    </section>
  `;

  bindDocumentsListEvents();
}

function bindDocumentsListEvents() {
  const toolbarForm = document.querySelector('#documents-toolbar-form');
  const resetButton = document.querySelector('#documents-reset-filters');
  const appRoot = document.querySelector('#app');
  const sortHeaders = document.querySelectorAll('[data-sort]');
  const paginationButtons = document.querySelectorAll('[data-page]');

  if (toolbarForm) {
    toolbarForm.addEventListener('submit', handleToolbarSubmit);
  }

  if (resetButton) {
    resetButton.addEventListener('click', handleToolbarReset);
  }

  if (appRoot) {
    appRoot.addEventListener('click', handleListActionClick);
  }

  sortHeaders.forEach((header) => {
    header.addEventListener('click', handleSortClick);
  });

  paginationButtons.forEach((button) => {
    button.addEventListener('click', handlePaginationClick);
  });
}

async function handleListActionClick(event) {
  const trigger = event.target.closest('[data-action]');
  if (!trigger) return;

  const action = trigger.dataset.action;
  const documentId = trigger.dataset.documentId;

  if (!action || !documentId) return;

  if (action === 'post-document') {
    await handleDocumentPosting(documentId, {
      redirectTo: 'list',
    });
    return;
  }

  if (action === 'cancel-document') {
    await handleDocumentCancel(documentId, {
      redirectTo: 'list',
    });
  }
}

function handleToolbarSubmit(event) {
  event.preventDefault();

  const currentFilters = getCurrentListFilters();
  const form = event.currentTarget;
  const formData = new FormData(form);

  const query = formData.get('query')?.toString().trim() || '';
  const status = formData.get('status')?.toString().trim() || 'all';

  const params = new URLSearchParams();

  if (query) {
    params.set('query', query);
  }

  if (status && status !== 'all') {
    params.set('status', status);
  }

  if (currentFilters.sortBy && currentFilters.sortBy !== 'dateDesc') {
    params.set('sortBy', currentFilters.sortBy);
  }

  params.set('page', '1');

  const queryString = params.toString();
  window.location.hash = queryString ? `#documents?${queryString}` : '#documents';
}

function handleToolbarReset() {
  window.location.hash = '#documents';
}

function handleSortClick(event) {
  const field = event.currentTarget.dataset.sort;
  const filters = getCurrentListFilters();
  const params = buildParamsFromFilters(filters);

  if (field === 'date') {
    const nextSort = filters.sortBy === 'dateAsc' ? 'dateDesc' : 'dateAsc';

    if (nextSort !== 'dateDesc') {
      params.set('sortBy', nextSort);
    } else {
      params.delete('sortBy');
    }
  }

  params.set('page', '1');

  const queryString = params.toString();
  window.location.hash = queryString ? `#documents?${queryString}` : '#documents';
}

function handlePaginationClick(event) {
  const action = event.currentTarget.dataset.page;
  const filters = getCurrentListFilters();
  const nextPage =
    action === 'prev'
      ? Math.max(1, filters.page - 1)
      : filters.page + 1;

  const params = buildParamsFromFilters(filters);

  if (nextPage > 1) {
    params.set('page', String(nextPage));
  } else {
    params.delete('page');
  }

  const queryString = params.toString();
  window.location.hash = queryString ? `#documents?${queryString}` : '#documents';
}

function getCurrentListFilters() {
  const hash = window.location.hash || '#documents';
  const [, queryString = ''] = hash.split('?');
  const params = new URLSearchParams(queryString);

  return {
    query: params.get('query') || '',
    status: params.get('status') || 'all',
    sortBy: params.get('sortBy') || 'dateDesc',
    page: Number(params.get('page') || 1),
  };
}

function buildParamsFromFilters(filters) {
  const params = new URLSearchParams();

  if (filters.query) {
    params.set('query', filters.query);
  }

  if (filters.status && filters.status !== 'all') {
    params.set('status', filters.status);
  }

  if (filters.sortBy && filters.sortBy !== 'dateDesc') {
    params.set('sortBy', filters.sortBy);
  }

  if (filters.page && filters.page > 1) {
    params.set('page', String(filters.page));
  }

  return params;
}

function renderSortIndicator(sortBy, field) {
  if (field !== 'date') return '';

  if (sortBy === 'dateAsc') return '↑';
  if (sortBy === 'dateDesc') return '↓';

  return '';
}

function formatDocumentDate(value) {
  if (!value) return '-';

  const [year, month, day] = value.split('-');
  if (!year || !month || !day) return value;

  return `${day}/${month}/${year}`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}
