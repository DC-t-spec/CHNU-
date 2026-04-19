import { listDocuments, getDocumentsCounters } from '../../services/documents.service.js';

export async function renderDocumentsListPage() {
  const app = document.querySelector('#app');
  if (!app) return;

  const counters = getDocumentsCounters();
  const documents = listDocuments(getFilters());

  app.innerHTML = `
    <section class="page-shell">

      <!-- HEADER -->
      <div class="page-header" style="display:flex;justify-content:space-between;align-items:center;gap:16px;flex-wrap:wrap;">
        <div>
          <h1>Documentos</h1>
          <p>Gestão de documentos operacionais.</p>
        </div>

        <a href="#documents/new" class="btn btn-primary">+ Novo Documento</a>
      </div>

      <!-- CARDS -->
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-top:16px;">
        ${renderCard('Total', counters.total)}
        ${renderCard('Rascunhos', counters.draft)}
        ${renderCard('Lançados', counters.posted)}
        ${renderCard('Cancelados', counters.cancelled)}
      </div>

      <!-- FILTROS -->
      <div class="card" style="margin-top:16px;">
        <div style="display:flex;gap:12px;flex-wrap:wrap;">
          <input 
            type="text" 
            placeholder="Pesquisar..." 
            id="search-input"
            class="toolbar__input"
            style="flex:1;"
          />

          <select id="status-filter" class="toolbar__select">
            <option value="">Todos</option>
            <option value="draft">Rascunho</option>
            <option value="posted">Lançado</option>
            <option value="cancelled">Cancelado</option>
          </select>
        </div>
      </div>

      <!-- TABELA -->
      <div class="card" style="margin-top:16px;">
        <div class="table-responsive">
          <table class="table">
            <thead>
              <tr>
                <th>Número</th>
                <th>Tipo</th>
                <th>Origem</th>
                <th>Destino</th>
                <th>Data</th>
                <th>Status</th>
                <th>Total</th>
                <th></th>
              </tr>
            </thead>

            <tbody>
              ${
                documents.length
                  ? documents.map(renderRow).join('')
                  : `
                    <tr>
                      <td colspan="8" style="text-align:center;">
                        Sem documentos.
                      </td>
                    </tr>
                  `
              }
            </tbody>
          </table>
        </div>
      </div>

    </section>
  `;

  bindEvents();
}

/* ============================= */

function renderCard(label, value) {
  return `
    <div class="card">
      <div style="display:flex;flex-direction:column;gap:6px;">
        <span style="font-size:12px;color:#888;">${label}</span>
        <strong style="font-size:22px;">${value}</strong>
      </div>
    </div>
  `;
}

/* ============================= */

function renderRow(doc) {
  return `
    <tr>
      <td>${doc.number}</td>
      <td>${doc.type}</td>
      <td>${doc.origin || '—'}</td>
      <td>${doc.destination || '—'}</td>
      <td>${formatDate(doc.date)}</td>
      <td>${renderStatus(doc.status)}</td>
      <td>${formatMoney(doc.grandTotal)}</td>
      <td>
        <div style="display:flex;gap:6px;">
          <a href="#documents/view?id=${doc.id}" class="btn btn-ghost btn-sm">Ver</a>

          ${
            doc.status === 'draft'
              ? `<a href="#documents/edit?id=${doc.id}" class="btn btn-ghost btn-sm">Editar</a>`
              : ''
          }
        </div>
      </td>
    </tr>
  `;
}

/* ============================= */

function renderStatus(status) {
  const map = {
    draft: 'Rascunho',
    posted: 'Lançado',
    cancelled: 'Cancelado',
  };

  return `<span class="badge badge-${status}">${map[status]}</span>`;
}

/* ============================= */

function formatDate(value) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('pt-PT');
}

function formatMoney(value) {
  return Number(value || 0).toFixed(2);
}

/* ============================= */

function getFilters() {
  return {
    query: '',
    status: '',
  };
}

/* ============================= */

function bindEvents() {
  const searchInput = document.getElementById('search-input');
  const statusFilter = document.getElementById('status-filter');

  searchInput?.addEventListener('input', reload);
  statusFilter?.addEventListener('change', reload);
}

function reload() {
  const query = document.getElementById('search-input')?.value || '';
  const status = document.getElementById('status-filter')?.value || '';

  const app = document.querySelector('#app');

  const documents = listDocuments({ query, status });

  const tbody = app.querySelector('tbody');

  if (!tbody) return;

  tbody.innerHTML = documents.length
    ? documents.map(renderRow).join('')
    : `
      <tr>
        <td colspan="8" style="text-align:center;">
          Sem resultados.
        </td>
      </tr>
    `;
}
