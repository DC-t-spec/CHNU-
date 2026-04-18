import {
  getDocumentById,
  saveDocument,
  getProducts,
  getWarehouses,
} from '../../services/documents.service.js';
import { showToast } from '../../ui/toast.js';
import { assertEditableDocument } from '../../services/document-status.service.js';
import { initDocumentLines } from './document-lines.js';

export async function renderDocumentFormPage(context = {}) {
  const appRoot = document.querySelector('#app');
  if (!appRoot) return;

  const documentId = context?.params?.id || context?.query?.id || null;

  const products = typeof getProducts === 'function' ? getProducts() : [];
  const warehouses = typeof getWarehouses === 'function' ? getWarehouses() : [];
  const existing = documentId ? getDocumentById(documentId) : null;

  if (documentId && !existing) {
    appRoot.innerHTML = `
      <section class="page-shell">
        <div class="card">
          <div class="card-header">
            <h2>Documento não encontrado</h2>
          </div>
          <div class="card-body" style="display:grid;gap:12px;">
            <p>O documento solicitado não existe.</p>
            <div>
              <a href="#documents" class="btn btn-primary">Voltar</a>
            </div>
          </div>
        </div>
      </section>
    `;
    return;
  }

  if (documentId && existing) {
    try {
      if (typeof assertEditableDocument === 'function') {
        assertEditableDocument(documentId);
      }
    } catch (error) {
      appRoot.innerHTML = `
        <section class="page-shell">
          <div class="card">
            <div class="card-header">
              <h2>Edição bloqueada</h2>
            </div>
            <div class="card-body" style="display:grid;gap:12px;">
              <p>${escapeHtml(error.message)}</p>
              <div style="display:flex;gap:8px;flex-wrap:wrap;">
                <a href="#documents" class="btn btn-secondary">Voltar</a>
                <a href="#documents/view?id=${existing.id}" class="btn btn-primary">Ver documento</a>
              </div>
            </div>
          </div>
        </section>
      `;
      return;
    }
  }

  const initialLines = existing?.lines?.length
    ? existing.lines.map((line) => ({
        id: line.id || crypto.randomUUID(),
        product_id: line.product_id || line.itemId || '',
        warehouse_id: line.warehouse_id || '',
        quantity: Number(line.quantity || 0),
        unitPrice: Number(line.unitPrice || 0),
        total: Number(line.total || 0),
      }))
    : [
        {
          id: crypto.randomUUID(),
          product_id: '',
          warehouse_id: '',
          quantity: 1,
          unitPrice: 0,
          total: 0,
        },
      ];

  appRoot.innerHTML = `
    <section class="page-shell documents-form-page">
      <div class="page-header" style="display:flex;justify-content:space-between;align-items:flex-start;gap:16px;flex-wrap:wrap;">
        <div>
          <h1>${documentId ? 'Editar documento' : 'Novo documento'}</h1>
          <p>Preenchimento operacional com validação e integração ao stock.</p>
        </div>

        <div class="page-actions" style="display:flex;gap:8px;flex-wrap:wrap;">
          <a href="#documents" class="btn btn-secondary">Voltar</a>
          <button type="button" class="btn btn-primary" id="save-document-btn">Guardar</button>
        </div>
      </div>

      <div class="card">
        <div class="document-form-grid" style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px;">
          <div class="form-group">
            <label for="doc-date">Data</label>
            <input type="date" id="doc-date" class="toolbar__input" value="${escapeHtml(existing?.date || getTodayDate())}" />
          </div>

          <div class="form-group">
            <label for="doc-type">Tipo</label>
            <select id="doc-type" class="toolbar__select">
              <option value="Transferência">Transferência</option>
              <option value="Ajuste">Ajuste</option>
            </select>
          </div>

          <div class="form-group">
            <label for="doc-origin">Origem</label>
            <select id="doc-origin" class="toolbar__select">
              <option value="">Selecionar</option>
              ${warehouses.map((warehouse) => `
                <option value="${escapeHtml(warehouse.id)}">${escapeHtml(warehouse.name)}</option>
              `).join('')}
            </select>
          </div>

          <div class="form-group">
            <label for="doc-destination">Destino</label>
            <select id="doc-destination" class="toolbar__select">
              <option value="">Selecionar</option>
              ${warehouses.map((warehouse) => `
                <option value="${escapeHtml(warehouse.id)}">${escapeHtml(warehouse.name)}</option>
              `).join('')}
            </select>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="document-form__section-header" style="display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;">
          <h3>Linhas</h3>
          <button type="button" class="btn btn-secondary" id="add-line-btn">+ Linha</button>
        </div>

        <div id="document-lines"></div>
      </div>

      <div class="card">
        <div class="document-totals-card" style="display:flex;justify-content:flex-end;gap:24px;flex-wrap:wrap;">
          <div class="document-total-item">
            <span>Linhas</span>
            <strong id="doc-lines-count">0</strong>
          </div>

          <div class="document-total-item">
            <span>Total</span>
            <strong id="doc-total">0.00</strong>
          </div>
        </div>
      </div>
    </section>
  `;

  applyInitialHeaderValues();
  syncTypeRules();

  const linesController = initDocumentLines({
    containerSelector: '#document-lines',
    addButtonSelector: '#add-line-btn',
    products,
    warehouses,
    initialLines,
    onChange: handleLinesChange,
  });

  document.getElementById('doc-type')?.addEventListener('change', syncTypeRules);
  document.getElementById('save-document-btn')?.addEventListener('click', handleSave);

  function applyInitialHeaderValues() {
    const typeSelect = document.getElementById('doc-type');
    const originSelect = document.getElementById('doc-origin');
    const destinationSelect = document.getElementById('doc-destination');

    if (existing?.type && typeSelect) {
      typeSelect.value = existing.type;
    }

    if (existing?.origin && originSelect) {
      const originWarehouse = warehouses.find((warehouse) => warehouse.name === existing.origin || warehouse.id === existing.origin);
      if (originWarehouse) {
        originSelect.value = originWarehouse.id;
      }
    }

    if (existing?.destination && destinationSelect) {
      const destinationWarehouse = warehouses.find((warehouse) => warehouse.name === existing.destination || warehouse.id === existing.destination);
      if (destinationWarehouse) {
        destinationSelect.value = destinationWarehouse.id;
      }
    }
  }

  function syncTypeRules() {
    const type = document.getElementById('doc-type')?.value;
    const originSelect = document.getElementById('doc-origin');

    if (!originSelect) return;

    if (type === 'Ajuste') {
      originSelect.value = '';
      originSelect.disabled = true;
      return;
    }

    originSelect.disabled = false;
  }

  function handleLinesChange(summary) {
    const countEl = document.getElementById('doc-lines-count');
    const totalEl = document.getElementById('doc-total');

    if (countEl) countEl.textContent = String(summary.linesCount || 0);
    if (totalEl) totalEl.textContent = formatCurrency(summary.grandTotal || 0);
  }

  function handleSave() {
    const payload = {
      id: documentId,
      date: document.getElementById('doc-date')?.value || '',
      type: document.getElementById('doc-type')?.value || '',
      origin: document.getElementById('doc-origin')?.value || '',
      destination: document.getElementById('doc-destination')?.value || '',
      lines: linesController.getLines().map((line) => ({
        product_id: line.product_id || '',
        warehouse_id: line.warehouse_id || '',
        quantity: Number(line.quantity || 0),
        unitPrice: Number(line.unitPrice || 0),
      })),
    };

    const validationError = validateBeforeSave(payload);

    if (validationError) {
      showToast({
        type: 'error',
        message: validationError,
      });
      return;
    }

    try {
      const saved = saveDocument(payload);

      showToast({
        type: 'success',
        message: 'Documento guardado com sucesso.',
      });

      window.location.hash = `#documents/view?id=${saved.id}`;
    } catch (error) {
      console.error(error);
      showToast({
        type: 'error',
        message: error?.message || 'Erro ao guardar documento.',
      });
    }
  }
}

function validateBeforeSave(data) {
  if (!data.date) return 'Data obrigatória.';
  if (!data.type) return 'Tipo obrigatório.';

  if (data.type === 'Transferência') {
    if (!data.origin) return 'Origem obrigatória.';
    if (!data.destination) return 'Destino obrigatório.';
    if (data.origin === data.destination) return 'Origem e destino não podem ser iguais.';
  }

  if (data.type === 'Ajuste') {
    if (!data.destination) return 'Destino obrigatório.';
  }

  if (!Array.isArray(data.lines) || !data.lines.length) {
    return 'Adicione pelo menos uma linha.';
  }

  for (let index = 0; index < data.lines.length; index += 1) {
    const line = data.lines[index];

    if (!line.product_id) return `Linha ${index + 1}: selecione produto.`;
    if (!Number.isFinite(line.quantity) || line.quantity <= 0) return `Linha ${index + 1}: quantidade inválida.`;
    if (!Number.isFinite(line.unitPrice) || line.unitPrice < 0) return `Linha ${index + 1}: preço inválido.`;
  }

  return null;
}

function getTodayDate() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatCurrency(value) {
  return Number(value || 0).toLocaleString('pt-PT', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}
