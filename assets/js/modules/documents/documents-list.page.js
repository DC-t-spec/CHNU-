import { searchDocuments } from '../../core/state.js';
import { handleDocumentPosting } from './document-posting.js';
import { handleDocumentCancel } from './document-cancel.js';

export async function renderDocumentsListPage() {
  const appRoot = document.querySelector('#app');

  const filters = getCurrentListFilters();
  const documents = searchDocuments(filters);

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
                      <th>Data</th>
                      <th>Tipo</th>
                      <th>Origem</th>
                      <th>Destino</th>
                      <th>Status</th>
                      <th>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${documents.map((doc) => `
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
}

function handleListActionClick(event) {
  const trigger = event.target.closest('[data-action]');
  if (!trigger) return;

  const action = trigger.dataset.action;
  const documentId = trigger.dataset.documentId;

  if (!action || !documentId) return;

  if (action === 'post-document') {
    handleDocumentPosting(documentId, {
      redirectTo: 'list',
    });
    return;
  }

  if (action === 'cancel-document') {
    handleDocumentCancel(documentId, {
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
