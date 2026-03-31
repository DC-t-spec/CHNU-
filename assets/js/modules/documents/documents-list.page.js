import { searchDocuments } from '../../core/state.js';
import { handleDocumentPosting } from './document-posting.js';
import { handleDocumentCancel } from './document-cancel.js';

// 👇 AQUI (fora de qualquer função)
let currentSort = {
  field: 'date',
  direction: 'desc',
};


let currentPage = 1;
const pageSize = 5;

function paginateDocuments(list) {
  const start = (currentPage - 1) * pageSize;
  const end = start + pageSize;
  return list.slice(start, end);
}

function sortDocuments(list) {
  const { field, direction } = currentSort;

  return [...list].sort((a, b) => {
    let valA = a[field];
    let valB = b[field];

    if (field === 'date') {
      valA = new Date(valA);
      valB = new Date(valB);
    }

    if (valA < valB) return direction === 'asc' ? -1 : 1;
    if (valA > valB) return direction === 'asc' ? 1 : -1;
    return 0;
  });
}
export async function renderDocumentsListPage() {
  const appRoot = document.querySelector('#app');

  const filters = getCurrentListFilters();
const documents = searchDocuments({
  query: filters.query,
  status: filters.status === 'all' ? null : filters.status,
});
  const allDocuments = searchDocuments({});

const documentCounters = {
  total: allDocuments.length,
  draft: allDocuments.filter((doc) => doc.status === 'draft').length,
  posted: allDocuments.filter((doc) => doc.status === 'posted').length,
  cancelled: allDocuments.filter((doc) => doc.status === 'cancelled').length,
};

 

  const totalPages = Math.ceil(documents.length / pageSize);

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
    <strong class="documents-stat-card__value">${documentCounters.total}</strong>
  </div>

  <div class="documents-stat-card">
    <span class="documents-stat-card__label">Draft</span>
    <strong class="documents-stat-card__value">${documentCounters.draft}</strong>
  </div>

  <div class="documents-stat-card">
    <span class="documents-stat-card__label">Posted</span>
    <strong class="documents-stat-card__value">${documentCounters.posted}</strong>
  </div>

  <div class="documents-stat-card">
    <span class="documents-stat-card__label">Cancelled</span>
    <strong class="documents-stat-card__value">${documentCounters.cancelled}</strong>
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
          documents.length
            ? `
              <div class="table-responsive">
                <table class="data-table">
                  <thead>
                    <tr>
                      <th>Número</th>
                      <th data-sort="date" class="sortable">Data</th>
                      <th>Tipo</th>
                      <th>Origem</th>
                      <th>Destino</th>
                      <th>Status</th>
                      <th>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
${paginateDocuments(sortDocuments(documents)).map((doc) => `
                      <tr>
                        <td>${doc.number}</td>
                        <td>${formatDocumentDate(doc.date)}</td>
                        <td>${doc.type}</td>
                        <td>${doc.origin}</td>
                        <td>${doc.destination}</td>
                        <td>
                          <span class="status-chip status-${doc.status}">
                            ${doc.status}
                          </span>
                        </td>
                        <td>
                          <div class="table-actions">
                            <a href="#documents/view?id=${doc.id}" class="btn btn-sm btn-secondary">Ver</a>

                            ${
                              doc.status === 'draft'
                                ? `
                                  <a href="#documents/edit?id=${doc.id}" class="btn btn-sm btn-primary">Editar</a>
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
                              doc.status === 'posted'
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
                    `).join('')}
                  </tbody>
                </table>
                </div>

<div class="pagination">
  <button 
    class="btn btn-secondary"
    data-page="prev"
    ${currentPage === 1 ? 'disabled' : ''}
  >
    Anterior
  </button>

  <span class="pagination-info">
    Página ${currentPage} de ${totalPages || 1}
  </span>

  <button 
    class="btn btn-secondary"
    data-page="next"
    ${currentPage >= totalPages ? 'disabled' : ''}
  >
    Próxima
  </button>
</div>
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

  if (toolbarForm) {
    toolbarForm.addEventListener('submit', handleToolbarSubmit);
  }

  if (resetButton) {
    resetButton.addEventListener('click', handleToolbarReset);
  }

  if (appRoot) {
    appRoot.addEventListener('click', handleListActionClick);
  }
const headers = document.querySelectorAll('[data-sort]');
headers.forEach((header) => {
  header.addEventListener('click', () => {
    const field = header.dataset.sort;

    if (currentSort.field === field) {
      currentSort.direction =
        currentSort.direction === 'asc' ? 'desc' : 'asc';
    } else {
      currentSort.field = field;
      currentSort.direction = 'asc';
    }

    window.dispatchEvent(new HashChangeEvent('hashchange'));
  });
});

const paginationButtons = document.querySelectorAll('[data-page]');

paginationButtons.forEach((btn) => {
  btn.addEventListener('click', () => {
    const action = btn.dataset.page;

    if (action === 'prev' && currentPage > 1) {
      currentPage--;
    }

    if (action === 'next') {
      currentPage++;
    }

    window.dispatchEvent(new HashChangeEvent('hashchange'));
  });
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

  const params = new URLSearchParams();

  if (query) {
    params.set('query', query);
  }

  if (status && status !== 'all') {
    params.set('status', status);
  }

  const queryString = params.toString();
  window.location.hash = queryString ? `#documents?${queryString}` : '#documents';
}

function handleToolbarReset() {
  window.location.hash = '#documents';
}

function getCurrentListFilters() {
  const hash = window.location.hash || '#documents';
  const [, queryString = ''] = hash.split('?');
  const params = new URLSearchParams(queryString);

  return {
    query: params.get('query') || '',
    status: params.get('status') || 'all',
  };
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
