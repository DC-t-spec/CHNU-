// assets/js/modules/documents/documents-list.page.js

import { getDocumentsList } from '../../services/documents.service.js';
import { handleDocumentPosting } from './document-posting.js';
import { handleDocumentCancel } from './document-cancel.js';

const DEFAULT_PAGE_SIZE = 10;

export async function renderDocumentsListPage() {
  const appRoot = document.querySelector('#app');
  const filters = getCurrentListFilters();

  const result = getDocumentsList({
    query: filters.query,
    status: filters.status,
    sortBy: filters.sortBy,
    page: filters.page,
    pageSize: DEFAULT_PAGE_SIZE,
  });

  const { items, summaries, pagination } = result;

  appRoot.innerHTML = `
    <section class="page-shell documents-page">
      <div class="page-header">
        <div>
          <h1>Documentos</h1>
          <p>Gestão de documentos operacionais com integração ao stock.</p>
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

          <div class="toolbar__group">
            <label for="documents-sort" class="toolbar__label">Ordenação</label>
            <select id="documents-sort" name="sortBy" class="toolbar__select">
              <option value="dateDesc" ${filters.sortBy === 'dateDesc' ? 'selected' : ''}>Data ↓</option>
              <option value="dateAsc" ${filters.sortBy === 'dateAsc' ? 'selected' : ''}>Data ↑</option>
              <option value="numberAsc" ${filters.sortBy === 'numberAsc' ? 'selected' : ''}>Número ↑</option>
              <option value="numberDesc" ${filters.sortBy === 'numberDesc' ? 'selected' : ''}>Número ↓</option>
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
                      <th>Data</th>
                      <th>Tipo</th>
                      <th>Origem</th>
                      <th>Destino</th>
                      <th>Linhas</th>
                      <th>Total</th>
                      <th>Status</th>
                      <th>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${items
                      .map(
                        (doc) => `
                          <tr>
                            <td>
                              <strong>${escapeHtml(doc.number || '-')}</strong>
                            </td>
                            <td>${formatDocumentDate(doc.date)}</td>
                            <td>${escapeHtml(doc.type || '-')}</td>
                            <td>${escapeHtml(doc.origin || '-')}</td>
                            <td>${escapeHtml(doc.destination || '-')}</td>
                            <td>${Number(doc.linesCount || 0)}</td>
                            <td><strong>${formatCurrency(doc.grandTotal || 0)}</strong></td>
                            <td>
                              <span class="status-chip status-${escapeHtml(doc.status)}">
                                ${escapeHtml(doc.statusLabel)}
                              </span>
                            </td>
                            <td>
                              <div class="table-actions">
                                <a href="#documents/view?id=${doc.id}" class="btn btn-sm btn-secondary">Ver</a>

                                ${
                                  doc.canEdit
                                    ? `<a href="#documents/edit?id=${doc.id}" class="btn btn-sm btn-primary">Editar</a>`
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
                  type="button"
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
                  type="button"
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

  const form = event.currentTarget;
  const formData = new FormData(form);

  const query = formData.get('query')?.toString().trim() || '';
  const status = formData.get('status')?.toString().trim() || 'all';
  const sortBy = formData.get('sortBy')?.toString().trim() || 'dateDesc';

  const params = new URLSearchParams();

  if (query) {
    params.set('query', query);
  }

  if (status && status !== 'all') {
    params.set('status', status);
  }

  if (sortBy && sortBy !== 'dateDesc') {
    params.set('sortBy', sortBy);
  }

  params.set('page', '1');

  const queryString = params.toString();
  window.location.hash = queryString ? `#documents?${queryString}` : '#documents';
}

function handleToolbarReset() {
  window.location.hash = '#documents';
}

function handlePaginationClick(event) {
  const action = event.currentTarget.dataset.page;
  const filters = getCurrentListFilters();

  let nextPage = filters.page;

  if (action === 'prev') {
    nextPage = Math.max(1, filters.page - 1);
  }

  if (action === 'next') {
    nextPage = filters.page + 1;
  }

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

function formatDocumentDate(value) {
  if (!value) return '-';

  const [year, month, day] = String(value).split('-');
  if (!year || !month || !day) return value;

  return `${day}/${month}/${year}`;
}

function formatCurrency(value) {
  return Number(value || 0).toLocaleString('pt-PT', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}
