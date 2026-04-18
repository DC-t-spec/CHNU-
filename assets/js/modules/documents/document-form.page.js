import { parseHash } from '../../core/router.js';
import {
  getDocumentById,
  saveDocument,
} from '../../services/documents.service.js';
import {
  renderDocumentLines,
  getDocumentLines,
  computeDocumentTotals,
} from './document-lines.js';
import { showToast } from '../../ui/toast.js';

function getPageState() {
  const { fullPath, query } = parseHash();
  const isEdit = fullPath === '/documents/edit';
  const documentId = query.id || '';

  return {
    isEdit,
    documentId,
  };
}

function getFormValues(form, lines) {
  const formData = new FormData(form);

  return {
    id: form.dataset.documentId || '',
    status: form.dataset.documentStatus || 'draft',
    number: formData.get('number')?.toString().trim() ?? '',
    type: formData.get('type')?.toString().trim() ?? 'transfer',
    date: formData.get('date')?.toString().trim() ?? '',
    reference: formData.get('reference')?.toString().trim() ?? '',
    origin: formData.get('origin')?.toString().trim() ?? '',
    destination: formData.get('destination')?.toString().trim() ?? '',
    notes: formData.get('notes')?.toString().trim() ?? '',
    lines,
  };
}

function validateDocument(values) {
  if (!values.date) {
    throw new Error('Preenche a data do documento.');
  }

  if (!values.type) {
    throw new Error('Escolhe o tipo de documento.');
  }

  if (!values.lines.length) {
    throw new Error('Adiciona pelo menos uma linha.');
  }
}

export async function renderDocumentFormPage() {
  const app = document.querySelector('#app');
  if (!app) return;

  const { isEdit, documentId } = getPageState();
  const documentData = isEdit ? getDocumentById(documentId) : null;

  if (isEdit && !documentData) {
    app.innerHTML = `
      <section class="page-shell">
        <div class="empty-state">
          <div class="empty-state__icon">📄</div>
          <h3>Documento não encontrado</h3>
          <p>Não foi possível carregar o documento para edição.</p>
        </div>
      </section>
    `;
    return;
  }

  const readOnly = isEdit && ['posted', 'cancelled'].includes(documentData.status);
  const title = isEdit ? 'Editar documento' : 'Novo documento';

  app.innerHTML = `
    <section class="page-shell">
      <div class="page-header" style="display:flex;justify-content:space-between;gap:16px;align-items:flex-start;">
        <div>
          <h1>${title}</h1>
          <p>${isEdit ? 'Actualiza o rascunho do documento.' : 'Criação de novo documento.'}</p>
        </div>

        <div style="display:flex;gap:8px;flex-wrap:wrap;">
          <a class="btn btn-ghost" href="#documents">Voltar</a>
          ${
            isEdit
              ? `<a class="btn btn-secondary" href="#documents/view?id=${documentData.id}">Ver documento</a>`
              : ''
          }
        </div>
      </div>

      <form id="document-form" class="document-form" data-document-id="${documentData?.id ?? ''}" data-document-status="${documentData?.status ?? 'draft'}">
        <div class="grid grid-2" style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px;">
          <div class="card">
            <div class="card-header">
              <h3>Dados principais</h3>
            </div>

            <div class="form-grid" style="display:grid;gap:12px;">
              <label class="form-field">
                <span>Número</span>
                <input type="text" name="number" value="${documentData?.number ?? ''}" ${readOnly ? 'disabled' : ''} />
              </label>

              <label class="form-field">
                <span>Tipo</span>
                <select name="type" ${readOnly ? 'disabled' : ''}>
                  <option value="transfer" ${documentData?.type === 'transfer' ? 'selected' : ''}>Transferência</option>
                  <option value="purchase" ${documentData?.type === 'purchase' ? 'selected' : ''}>Compra</option>
                  <option value="sale" ${documentData?.type === 'sale' ? 'selected' : ''}>Venda</option>
                  <option value="adjustment" ${documentData?.type === 'adjustment' ? 'selected' : ''}>Ajuste</option>
                  <option value="return" ${documentData?.type === 'return' ? 'selected' : ''}>Devolução</option>
                </select>
              </label>

              <label class="form-field">
                <span>Data</span>
                <input type="date" name="date" value="${documentData?.date ?? new Date().toISOString().slice(0, 10)}" ${readOnly ? 'disabled' : ''} />
              </label>

              <label class="form-field">
                <span>Referência</span>
                <input type="text" name="reference" value="${documentData?.reference ?? ''}" ${readOnly ? 'disabled' : ''} />
              </label>
            </div>
          </div>

          <div class="card">
            <div class="card-header">
              <h3>Origem e destino</h3>
            </div>

            <div class="form-grid" style="display:grid;gap:12px;">
              <label class="form-field">
                <span>Origem</span>
                <input type="text" name="origin" value="${documentData?.origin ?? ''}" ${readOnly ? 'disabled' : ''} />
              </label>

              <label class="form-field">
                <span>Destino</span>
                <input type="text" name="destination" value="${documentData?.destination ?? ''}" ${readOnly ? 'disabled' : ''} />
              </label>

              <label class="form-field">
                <span>Observações</span>
                <textarea name="notes" rows="6" ${readOnly ? 'disabled' : ''}>${documentData?.notes ?? ''}</textarea>
              </label>
            </div>
          </div>
        </div>

        <div id="document-lines-root" style="margin-top:16px;"></div>

        <div class="card" style="margin-top:16px;">
          <div class="card-body" style="display:flex;justify-content:space-between;align-items:center;gap:16px;flex-wrap:wrap;">
            <div id="document-form-totals" style="font-weight:600;">Linhas: 0 | Total: 0.00</div>

            <div style="display:flex;gap:8px;flex-wrap:wrap;">
              <a class="btn btn-ghost" href="#documents">Cancelar</a>
              ${
                readOnly
                  ? ''
                  : `<button type="submit" class="btn btn-primary">${isEdit ? 'Actualizar rascunho' : 'Guardar rascunho'}</button>`
              }
            </div>
          </div>
        </div>
      </form>
    </section>
  `;

  const form = document.querySelector('#document-form');
  const linesRoot = document.querySelector('#document-lines-root');
  const totalsEl = document.querySelector('#document-form-totals');

  renderDocumentLines(linesRoot, documentData?.lines ?? []);

  function refreshTotals() {
    const lines = getDocumentLines(linesRoot);
    const totals = computeDocumentTotals(lines);
    totalsEl.textContent = `Linhas: ${totals.linesCount} | Total: ${totals.grandTotal.toFixed(2)}`;
  }

  linesRoot.addEventListener('input', refreshTotals);
  linesRoot.addEventListener('click', () => {
    setTimeout(refreshTotals, 0);
  });

  refreshTotals();

  if (readOnly) return;

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    try {
      const lines = getDocumentLines(linesRoot);
      const values = getFormValues(form, lines);

      validateDocument(values);

      const saved = await saveDocument(values);

      showToast({
        type: 'success',
        message: isEdit ? 'Documento actualizado com sucesso.' : 'Documento criado com sucesso.',
      });

      const nextId = saved?.id || values.id;
      if (nextId) {
        window.location.hash = `#documents/view?id=${nextId}`;
      } else {
        window.location.hash = '#documents';
      }
    } catch (error) {
      showToast({
        type: 'error',
        message: error?.message || 'Falha ao guardar documento.',
      });
    }
  });
}
