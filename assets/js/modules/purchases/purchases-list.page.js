import { listDocuments } from '../../services/documents.service.js';

function getPurchases(filters = {}) {
  return listDocuments(filters).filter((doc) => doc.type === 'purchase');
}

function formatDate(value) {
  return value ? new Date(value).toLocaleDateString('pt-PT') : '—';
}

function formatMoney(value) {
  return Number(value || 0).toLocaleString('pt-PT', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function badge(status) {
  const map = { draft: 'Rascunho', posted: 'Postado', cancelled: 'Cancelado' };
  return `<span class="badge badge-${status}">${map[status] || status}</span>`;
}

export async function renderPurchasesListPage() {
  const app = document.querySelector('#app');
  if (!app) return;

  const purchases = getPurchases({ query: '', status: '' });

  app.innerHTML = `
    <section class="page-shell">
      <div class="page-header" style="display:flex;justify-content:space-between;align-items:center;gap:16px;flex-wrap:wrap;">
        <div><h1>Purchases PRO</h1><p>Compras com Document Engine.</p></div>
        <a href="#purchases/new" class="btn btn-primary">+ Nova Compra</a>
      </div>

      <div class="card" style="margin-top:16px;"><div style="display:flex;gap:12px;flex-wrap:wrap;">
        <input type="text" placeholder="Pesquisar compra/fornecedor..." id="search-input" class="toolbar__input" style="flex:1;" />
        <select id="status-filter" class="toolbar__select"><option value="">Todos</option><option value="draft">Rascunho</option><option value="posted">Postado</option><option value="cancelled">Cancelado</option></select>
      </div></div>

      <div class="card" style="margin-top:16px;">
        <div class="table-responsive"><table class="table">
          <thead><tr><th>Número</th><th>Data</th><th>Fornecedor</th><th>Status</th><th>Total</th><th>Ações</th></tr></thead>
          <tbody>${purchases.length ? purchases.map((doc) => `
            <tr>
              <td>${doc.number}</td>
              <td>${formatDate(doc.date)}</td>
              <td>${doc.supplier_name || doc.supplier_id || '—'}</td>
              <td>${badge(doc.status)}</td>
              <td>${formatMoney(doc.grandTotal)}</td>
              <td><a class="btn btn-ghost btn-sm" href="#purchases/view?id=${doc.id}">Ver</a>${doc.status === 'draft' ? `<a class="btn btn-ghost btn-sm" href="#purchases/edit?id=${doc.id}">Editar</a>` : ''}</td>
            </tr>
          `).join('') : '<tr><td colspan="6" style="text-align:center;">Sem compras.</td></tr>'}</tbody>
        </table></div>
      </div>
    </section>
  `;

  document.getElementById('search-input')?.addEventListener('input', reload);
  document.getElementById('status-filter')?.addEventListener('change', reload);
}

function reload() {
  const query = document.getElementById('search-input')?.value || '';
  const status = document.getElementById('status-filter')?.value || '';
  const tbody = document.querySelector('#app tbody');
  if (!tbody) return;

  const purchases = getPurchases({ query, status });
  tbody.innerHTML = purchases.length ? purchases.map((doc) => `
    <tr>
      <td>${doc.number}</td>
      <td>${formatDate(doc.date)}</td>
      <td>${doc.supplier_name || doc.supplier_id || '—'}</td>
      <td>${badge(doc.status)}</td>
      <td>${formatMoney(doc.grandTotal)}</td>
      <td><a class="btn btn-ghost btn-sm" href="#purchases/view?id=${doc.id}">Ver</a>${doc.status === 'draft' ? `<a class="btn btn-ghost btn-sm" href="#purchases/edit?id=${doc.id}">Editar</a>` : ''}</td>
    </tr>
  `).join('') : '<tr><td colspan="6" style="text-align:center;">Sem resultados.</td></tr>';
}
