import {
  listDocuments,
  getDocumentsCounters,
} from '../../services/documents.service.js';

function getCurrentListFilters() {
  const params = new URLSearchParams(window.location.hash.split('?')[1] || '');

  return {
    query: (params.get('query') || '').trim(),
    status: (params.get('status') || 'all').trim(),
  };
}

function updateHashFilters(filters = {}) {
  const params = new URLSearchParams();

  if (filters.query) params.set('query', filters.query);
  if (filters.status && filters.status !== 'all') params.set('status', filters.status);

  const queryString = params.toString();
  window.location.hash = queryString ? `#documents?${queryString}` : '#documents';
}

function formatDate(value) {
  if (!value) return '—';

  try {
    return new Intl.DateTimeFormat('pt-PT').format(new Date(value));
  } catch {
    return value;
  }
}

function formatMoney(value) {
  const num = Number(value || 0);
  return num.toFixed(2);
}

function getStatusLabel(status) {
  const labels = {
    draft: 'Rascunho',
    posted: 'Lançado',
    cancelled: 'Cancelado',
  };

  return labels[status] || status || '—';
}

function getStatusOptions(currentStatus = 'all') {
  const options = [
    { value: 'all', label: 'Todos' },
    { value: 'draft', label: 'Rascunhos' },
    { value: 'posted', label: 'Lançados' },
    { value: 'cancelled', label: 'Cancelados' },
  ];

  return options
    .map(
      (option) => `
        <option value="${option.value}" ${option.value === currentStatus ? 'selected' : ''}>
          ${option.label}
        </option>
      `
    )
    .join('');
}

function buildCountersHtml(counters) {
  return `
    <div class="stats-grid" style="display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:16px;">
      <div class="card">
        <div class="card-body">
          <div class="stat-label">Total</div>
          <div class="stat-value">${counters.total}</div>
        </div>
      </div>

      <div class="card">
        <div class="card-body">
          <div class="stat-label">Rascunhos</div>
          <div class="stat-value">${counters.draft}</div>
        </div>
      </div>

      <div class="card">
        <div class="card-body">
          <div class="stat-label">Lançados</div>
          <div class="stat-value">${counters.posted}</div>
        </div>
      </div>

      <div class="card">
        <div class="card-body">
          <div class="stat-label">Cancelados</div>
          <div class="stat-value">${counters.cancelled}</div>
        </div>
      </div>
    </div>
  `;
}

function buildRowsHtml(documents) {
  if (!documents.length) {
    return `
      <tr>
        <td colspan="9" style="text-align:center;">Nenhum documento encontrado.</td>
      </tr>
    `;
  }

  return documents
    .map(
      (doc) => `
        <tr>
          <td>${doc.number || '—'}</td>
          <td>${doc.type || '—'}</td>
          <td><span class="badge badge-${doc.status}">${getStatusLabel(doc.status)}</span></td>
          <td>${formatDate(doc.date)}</td>
          <td>${doc.origin || '—'}</td>
          <td>${doc.destination || '—'}</td>
          <td>${doc.linesCount ?? 0}</td>
          <td>${formatMoney(doc.grandTotal)}</td>
          <td>
            <div style="display:flex;gap:8px;flex-wrap:wrap;">
              <a class="btn btn-sm btn-secondary" href="#documents/view?id=${doc.id}">Ver</a>
              ${
                doc.status === 'draft'
                  ? `<a class="btn btn-sm btn-ghost" href="#documents/edit?id=${doc.id}">Editar</a>`
                  : ''
              }
            </div>
          </td>
        </tr>
      `
    )
    .join('');
}

export async function renderDocumentsListPage() {
  const app = document.querySelector('#app');
  if (!app) return;

  const filters = getCurrentListFilters();

  const documents = listDocuments({
    query: filters.query || undefined,
    status: filters.status === 'all' ? null : filters.status,
  });

  const counters = getDocumentsCounters();

  app.innerHTML = `
    <section class="page-shell">
      <div class="page-header" style="display:flex;justify-content:space-between;gap:16px;align-items:flex-start;">
        <div>
          <h1>Documentos</h1>
          <p>Consulta e gestão de documentos.</p>
        </div>

        <div style="display:flex;gap:8px;flex-wrap:wrap;">
          <a class="btn btn-primary" href="#documents/new">Novo documento</a>
        </div>
      </div>

      ${buildCountersHtml(counters)}

      <div class="card" style="margin-top:16px;">
        <div class="card-body">
          <form id="documents-filters-form" style="display:grid;grid-template-columns:2fr 1fr auto;gap:12px;align-items:end;">
            <label class="form-field">
              <span>Pesquisar</span>
              <input
                type="text"
                name="query"
                placeholder="Número, origem, destino, referência..."
                value="${filters.query}"
              />
            </label>

            <label class="form-field">
              <span>Status</span>
              <select name="status">
                ${getStatusOptions(filters.status)}
              </select>
            </label>

            <button type="submit" class="btn btn-secondary">Filtrar</button>
          </form>
        </div>
      </div>

      <div class="card" style="margin-top:16px;">
        <div class="table-responsive">
          <table class="table">
            <thead>
              <tr>
                <th>Número</th>
                <th>Tipo</th>
                <th>Status</th>
                <th>Data</th>
                <th>Origem</th>
                <th>Destino</th>
                <th>Linhas</th>
                <th>Total</th>
                <th>Acções</th>
              </tr>
            </thead>
            <tbody>
              ${buildRowsHtml(documents)}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  `;

  const filtersForm = document.querySelector('#documents-filters-form');

  filtersForm?.addEventListener('submit', (event) => {
    event.preventDefault();

    const formData = new FormData(filtersForm);

    updateHashFilters({
      query: String(formData.get('query') || '').trim(),
      status: String(formData.get('status') || 'all').trim(),
    });
  });
}
