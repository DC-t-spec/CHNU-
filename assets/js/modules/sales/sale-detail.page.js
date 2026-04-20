import { parseHash } from '../../core/router.js';
import { getDocumentById, postDocumentById, cancelDocumentById } from '../../services/documents.service.js';
import { showToast } from '../../ui/toast.js';

function formatDate(value) {
  return value ? new Date(value).toLocaleString('pt-PT') : '—';
}

function formatMoney(value) {
  return Number(value || 0).toLocaleString('pt-PT', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export async function renderSaleDetailPage() {
  const app = document.querySelector('#app');
  if (!app) return;

  const { query } = parseHash();
  const sale = getDocumentById(query.id || '');

  if (!sale || sale.type !== 'sale') {
    app.innerHTML = '<section class="page-shell"><div class="card"><h2>Venda não encontrada</h2><a href="#sales" class="btn btn-primary">Voltar</a></div></section>';
    return;
  }

  app.innerHTML = `
    <section class="page-shell">
      <div class="page-header" style="display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap;">
        <div><h1>Venda ${sale.number}</h1><p>Detalhe completo da venda.</p></div>
        <div style="display:flex;gap:8px;"><a href="#sales" class="btn btn-secondary">Voltar</a>${sale.status === 'draft' ? `<a href="#sales/edit?id=${sale.id}" class="btn btn-ghost">Editar</a><button type="button" class="btn btn-primary" id="post-sale-btn">Postar venda</button>` : ''}${sale.status === 'posted' ? '<button type="button" class="btn btn-danger" id="cancel-sale-btn">Cancelar venda</button>' : ''}</div>
      </div>

      <div class="card" style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;">
        <div><strong>Data:</strong> ${formatDate(sale.date)}</div>
        <div><strong>Status:</strong> <span class="badge badge-${sale.status}">${sale.status}</span></div>
        <div><strong>Cliente:</strong> ${sale.customer_name || sale.customer_id || '—'}</div>
        <div><strong>Origem:</strong> ${sale.origin || '—'}</div>
        <div style="grid-column:1 / -1;"><strong>Notas:</strong> ${sale.notes || '—'}</div>
      </div>

      <div class="card" style="margin-top:16px;"><div class="table-responsive"><table class="table"><thead><tr><th>Produto</th><th>Qtd</th><th>Preço</th><th>Total</th></tr></thead><tbody>${sale.lines.map((line) => `
        <tr>
          <td>${line.product_name || line.product_id}</td>
          <td>${Number(line.qty || 0).toFixed(2)}</td>
          <td>${formatMoney(line.unit_cost || 0)}</td>
          <td>${formatMoney(line.line_total || 0)}</td>
        </tr>
      `).join('')}</tbody></table></div></div>

      <div class="card" style="display:flex;justify-content:flex-end;gap:24px;"><div>Linhas: <strong>${sale.linesCount || 0}</strong></div><div>Total Qtd: <strong>${Number(sale.totalQty || 0).toFixed(2)}</strong></div><div>Total: <strong>${formatMoney(sale.grandTotal)}</strong></div></div>
    </section>
  `;

  document.getElementById('post-sale-btn')?.addEventListener('click', () => {
    try {
      postDocumentById(sale.id);
      showToast({ type: 'success', message: 'Venda postada com sucesso.' });
      window.location.hash = `#sales/view?id=${sale.id}`;
    } catch (error) {
      showToast({ type: 'error', message: error?.message || 'Erro ao postar venda.' });
    }
  });

  document.getElementById('cancel-sale-btn')?.addEventListener('click', () => {
    try {
      cancelDocumentById(sale.id, 'Cancelamento de venda');
      showToast({ type: 'success', message: 'Venda cancelada com sucesso.' });
      window.location.hash = `#sales/view?id=${sale.id}`;
    } catch (error) {
      showToast({ type: 'error', message: error?.message || 'Erro ao cancelar venda.' });
    }
  });
}
