import { parseHash } from '../../core/router.js';
import { getDocumentById, postDocumentById, cancelDocumentById } from '../../services/documents.service.js';
import { showToast } from '../../ui/toast.js';

function formatDate(value) {
  return value ? new Date(value).toLocaleString('pt-PT') : '—';
}

function formatMoney(value) {
  return Number(value || 0).toLocaleString('pt-PT', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export async function renderPurchaseDetailPage() {
  const app = document.querySelector('#app');
  if (!app) return;

  const { query } = parseHash();
  const purchase = getDocumentById(query.id || '');

  if (!purchase || purchase.type !== 'purchase') {
    app.innerHTML = '<section class="page-shell"><div class="card"><h2>Compra não encontrada</h2><a href="#purchases" class="btn btn-primary">Voltar</a></div></section>';
    return;
  }

  app.innerHTML = `
    <section class="page-shell">
      <div class="page-header" style="display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap;">
        <div><h1>Compra ${purchase.number}</h1><p>Detalhe completo da compra.</p></div>
        <div style="display:flex;gap:8px;"><a href="#purchases" class="btn btn-secondary">Voltar</a>${purchase.status === 'draft' ? `<a href="#purchases/edit?id=${purchase.id}" class="btn btn-ghost">Editar</a><button type="button" class="btn btn-primary" id="post-purchase-btn">Postar compra</button>` : ''}${purchase.status === 'posted' ? '<button type="button" class="btn btn-danger" id="cancel-purchase-btn">Cancelar compra</button>' : ''}</div>
      </div>

      <div class="card" style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;">
        <div><strong>Data:</strong> ${formatDate(purchase.date)}</div>
        <div><strong>Status:</strong> <span class="badge badge-${purchase.status}">${purchase.status}</span></div>
        <div><strong>Fornecedor:</strong> ${purchase.supplier_name || purchase.supplier_id || '—'}</div>
        <div><strong>Destino:</strong> ${purchase.destination || '—'}</div>
        <div style="grid-column:1 / -1;"><strong>Notas:</strong> ${purchase.notes || '—'}</div>
      </div>

      <div class="card" style="margin-top:16px;"><div class="table-responsive"><table class="table"><thead><tr><th>Produto</th><th>Qtd</th><th>Custo Unit.</th><th>Total</th></tr></thead><tbody>${purchase.lines.map((line) => `
        <tr>
          <td>${line.product_name || line.product_id}</td>
          <td>${Number(line.qty || 0).toFixed(2)}</td>
          <td>${formatMoney(line.unit_cost || 0)}</td>
          <td>${formatMoney(line.line_total || 0)}</td>
        </tr>
      `).join('')}</tbody></table></div></div>

      <div class="card" style="display:flex;justify-content:flex-end;gap:24px;"><div>Linhas: <strong>${purchase.linesCount || 0}</strong></div><div>Total Qtd: <strong>${Number(purchase.totalQty || 0).toFixed(2)}</strong></div><div>Total: <strong>${formatMoney(purchase.grandTotal)}</strong></div></div>
    </section>
  `;

  document.getElementById('post-purchase-btn')?.addEventListener('click', () => {
    try {
      postDocumentById(purchase.id);
      showToast({ type: 'success', message: 'Compra postada com sucesso.' });
      window.location.hash = `#purchases/view?id=${purchase.id}`;
    } catch (error) {
      showToast({ type: 'error', message: error?.message || 'Erro ao postar compra.' });
    }
  });

  document.getElementById('cancel-purchase-btn')?.addEventListener('click', () => {
    try {
      cancelDocumentById(purchase.id, 'Cancelamento de compra');
      showToast({ type: 'success', message: 'Compra cancelada com sucesso.' });
      window.location.hash = `#purchases/view?id=${purchase.id}`;
    } catch (error) {
      showToast({ type: 'error', message: error?.message || 'Erro ao cancelar compra.' });
    }
  });
}
