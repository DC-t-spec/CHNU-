import { listDocuments, getDocumentsCounters } from '../../services/documents.service.js';

export async function renderDocumentsListPage() {
  const app = document.querySelector('#app');
  if (!app) return;

  const counters = getDocumentsCounters();
  const documents = listDocuments(getFilters());

  app.innerHTML = `
    <section class="page-shell">
      <div class="page-header" style="display:flex;justify-content:space-between;align-items:center;gap:16px;flex-wrap:wrap;">
        <div><h1>Documentos</h1><p>Motor documental operacional do ERP.</p></div>
        <a href="#documents/new" class="btn btn-primary">+ Novo Documento</a>
      </div>

      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-top:16px;">
        ${renderCard('Total', counters.total)}
        ${renderCard('Rascunhos', counters.draft)}
        ${renderCard('Postados', counters.posted)}
        ${renderCard('Cancelados', counters.cancelled)}
      </div>

      <div class="card" style="margin-top:16px;"><div style="display:flex;gap:12px;flex-wrap:wrap;">
        <input type="text" placeholder="Pesquisar..." id="search-input" class="toolbar__input" style="flex:1;" />
        <select id="status-filter" class="toolbar__select"><option value="">Todos</option><option value="draft">Rascunho</option><option value="posted">Postado</option><option value="cancelled">Cancelado</option></select>
      </div></div>

      <div class="card" style="margin-top:16px;">
        <div class="table-responsive"><table class="table">
          <thead><tr><th>Número</th><th>Data</th><th>Tipo</th><th>Status</th><th>Linhas</th><th>Total Qtd</th><th>Ações</th></tr></thead>
          <tbody>${documents.length ? documents.map(renderRow).join('') : '<tr><td colspan="7" style="text-align:center;">Sem documentos.</td></tr>'}</tbody>
        </table></div>
      </div>
    </section>
  `;

  bindEvents();
}

function renderCard(label, value) {
  return `<div class="card"><span style="font-size:12px;color:#888;">${label}</span><strong style="font-size:22px;">${value}</strong></div>`;
}

function renderRow(doc) {
  return `
    <tr>
      <td>${doc.number}</td>
      <td>${formatDate(doc.date)}</td>
      <td>${doc.type_label || doc.type}</td>
      <td>${renderStatus(doc.status)}</td>
      <td>${doc.linesCount || 0}</td>
      <td>${Number(doc.totalQty || 0).toFixed(2)}</td>
      <td><div style="display:flex;gap:6px;"><a href="#documents/view?id=${doc.id}" class="btn btn-ghost btn-sm">Ver</a>${doc.status === 'draft' ? `<a href="#documents/edit?id=${doc.id}" class="btn btn-ghost btn-sm">Editar</a>` : ''}</div></td>
    </tr>
  `;
}

function renderStatus(status) {
  const map = { draft: 'Rascunho', posted: 'Postado', cancelled: 'Cancelado' };
  return `<span class="badge badge-${status}">${map[status] || status}</span>`;
}

function formatDate(value) {
  return value ? new Date(value).toLocaleDateString('pt-PT') : '—';
}

function getFilters() {
  return { query: '', status: '' };
}

function bindEvents() {
  document.getElementById('search-input')?.addEventListener('input', reload);
  document.getElementById('status-filter')?.addEventListener('change', reload);
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
    : '<tr><td colspan="7" style="text-align:center;">Sem resultados.</td></tr>';
}
