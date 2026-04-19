import { parseHash } from '../../core/router.js';
import { getDocumentById } from '../../services/documents.service.js';
import { handleDocumentPosting } from './document-posting.js';
import { handleDocumentCancel } from './document-cancel.js';

function formatDate(value) {
  if (!value) return '—';

  try {
    return new Intl.DateTimeFormat('pt-PT').format(new Date(value));
  } catch {
    return value;
  }
}

function formatMoney(value) {
  const number = Number(value || 0);
  return number.toFixed(2);
}

function renderStatusBadge(status) {
  const map = {
    draft: 'Rascunho',
    posted: 'Lançado',
    cancelled: 'Cancelado',
  };

  return `<span class="badge badge-${status || 'draft'}">${map[status] || status}</span>`;
}

export async function renderDocumentDetailPage() {
  const app = document.querySelector('#app');
  if (!app) return;

  const { query } = parseHash();
  const documentId = query.id || '';
  const documentData = getDocumentById(documentId);

  if (!documentData) {
    app.innerHTML = `
      <section class="page-shell">
        <div class="empty-state">
          <div class="empty-state__icon">📄</div>
          <h3>Documento não encontrado</h3>
          <p>Não foi possível carregar o documento pedido.</p>
        </div>
      </section>
    `;
    return;
  }

  app.innerHTML = `
    <section class="page-shell">
      <div class="page-header" style="display:flex;justify-content:space-between;gap:16px;align-items:flex-start;">
        <div>
          <h1>Documento ${documentData.number || ''}</h1>
          <p>Detalhe completo do documento.</p>
        </div>

        <div style="display:flex;gap:8px;flex-wrap:wrap;">
          <a class="btn btn-ghost" href="#documents">Voltar</a>
          ${
            documentData.status === 'draft'
              ? `<a class="btn btn-secondary" href="#documents/edit?id=${documentData.id}">Editar</a>`
              : ''
          }
          ${
            documentData.status === 'draft'
              ? `<button type="button" class="btn btn-primary js-post-document">Lançar</button>`
              : ''
          }
          ${
            documentData.status === 'posted'
              ? `<button type="button" class="btn btn-danger js-cancel-document">Cancelar documento</button>`
              : ''
          }
        </div>
      </div>

      <div class="grid grid-2" style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px;">
        <div class="card">
          <div class="card-header">
            <h3>Informação geral</h3>
          </div>
          <div class="card-body" style="display:grid;gap:10px;">
            <div><strong>Número:</strong> ${documentData.number || '—'}</div>
            <div><strong>Tipo:</strong> ${documentData.type || '—'}</div>
            <div><strong>Status:</strong> ${renderStatusBadge(documentData.status)}</div>
            <div><strong>Data:</strong> ${formatDate(documentData.date)}</div>
            <div><strong>Referência:</strong> ${documentData.reference || '—'}</div>
            <div><strong>Origem:</strong> ${documentData.origin || '—'}</div>
            <div><strong>Destino:</strong> ${documentData.destination || '—'}</div>
          </div>
        </div>

        <div class="card">
          <div class="card-header">
            <h3>Estado do documento</h3>
          </div>
          <div class="card-body" style="display:grid;gap:10px;">
            <div><strong>Lançado em:</strong> ${formatDate(documentData.postedAt)}</div>
            <div><strong>Cancelado em:</strong> ${formatDate(documentData.cancelledAt)}</div>
            <div><strong>Motivo de cancelamento:</strong> ${documentData.cancelReason || '—'}</div>
            <div><strong>Criado em:</strong> ${formatDate(documentData.createdAt)}</div>
            <div><strong>Actualizado em:</strong> ${formatDate(documentData.updatedAt)}</div>
            <div><strong>Observações:</strong> ${documentData.notes || '—'}</div>
          </div>
        </div>
      </div>

      <div class="card" style="margin-top:16px;">
        <div class="card-header">
          <h3>Linhas</h3>
        </div>

        <div class="table-responsive">
          <table class="table">
            <thead>
              <tr>
                <th>Código</th>
                <th>Item</th>
                <th>Descrição</th>
                <th>Qtd</th>
                <th>Un</th>
                <th>Preço Unit.</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              ${
                documentData.lines.length
                  ? documentData.lines
                      .map(
                        (line) => `
                          <tr>
                            <td>${line.itemCode || '—'}</td>
                            <td>${line.itemName || '—'}</td>
                            <td>${line.description || '—'}</td>
                            <td>${line.quantity}</td>
                            <td>${line.unit || '—'}</td>
                            <td>${formatMoney(line.unitPrice)}</td>
                            <td>${formatMoney(line.total)}</td>
                          </tr>
                        `
                      )
                      .join('')
                  : `
                    <tr>
                      <td colspan="7" style="text-align:center;">Sem linhas registadas.</td>
                    </tr>
                  `
              }
            </tbody>
          </table>
        </div>

        <div class="card-body" style="display:flex;justify-content:flex-end;gap:24px;">
          <div><strong>Linhas:</strong> ${documentData.linesCount}</div>
          <div><strong>Total:</strong> ${formatMoney(documentData.grandTotal)}</div>
        </div>
      </div>
    </section>
  `;

  const postBtn = document.querySelector('.js-post-document');
  const cancelBtn = document.querySelector('.js-cancel-document');
import { showToast } from '../../ui/toast.js';

if (postBtn) {
  postBtn.addEventListener('click', async () => {
    try {
      await handleDocumentPosting(documentData.id);

      showToast({
        type: 'success',
        message: 'Documento lançado com sucesso.',
      });

      window.location.reload();
    } catch (err) {
      showToast({
        type: 'error',
        message: err.message || 'Erro ao lançar documento.',
      });
    }
  });
}

if (cancelBtn) {
  cancelBtn.addEventListener('click', async () => {
    try {
      await handleDocumentCancel(documentData.id);

      showToast({
        type: 'success',
        message: 'Documento cancelado.',
      });

      window.location.reload();
    } catch (err) {
      showToast({
        type: 'error',
        message: err.message || 'Erro ao cancelar documento.',
      });
    }
  });
}

}
